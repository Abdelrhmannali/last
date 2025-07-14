<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HRChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;



class AIChatController extends Controller
{
    protected $hrChatService;

    public function __construct(HRChatService $hrChatService)
    {
        $this->hrChatService = $hrChatService;
    }

    /**
     * معالجة رسائل الدردشة مع الذكاء الاصطناعي
     */
    public function chat(Request $request)
    {
        // تسجيل بداية الطلب
        Log::info('AI Chat Request Received', [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()
        ]);

        // التحقق من صحة البيانات
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|min:2|max:500',
            'conversation_history' => 'array|max:20',
            'conversation_history.*.role' => 'required_with:conversation_history|in:user,assistant',
            'conversation_history.*.content' => 'required_with:conversation_history|string|max:2000'
        ]);

        if ($validator->fails()) {
            Log::warning('AI Chat Validation Failed', [
                'errors' => $validator->errors()->toArray(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'بيانات غير صحيحة: ' . implode(', ', $validator->errors()->all()),
                'validation_errors' => $validator->errors()
            ], 422);
        }

        // Rate Limiting
        $key = 'chat_limit:' . $request->ip();
        $maxAttempts = 15; // زيادة العدد المسموح
        $decayMinutes = 1;

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            Log::warning('Rate limit exceeded', [
                'ip' => $request->ip(),
                'attempts' => RateLimiter::attempts($key)
            ]);

            return response()->json([
                'success' => false,
                'error' => 'تم تجاوز الحد المسموح من الرسائل. يرجى المحاولة بعد دقيقة.',
                'retry_after' => RateLimiter::availableIn($key)
            ], 429);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        try {
            $message = trim($request->input('message'));
            $history = $request->input('conversation_history', []);

            Log::info('Processing chat message', [
                'message_length' => strlen($message),
                'history_count' => count($history)
            ]);

            // تنظيف تاريخ المحادثة (الاحتفاظ بآخر 10 رسائل فقط)
            $history = array_slice($history, -10);

            // إرسال الرسالة للذكاء الاصطناعي
            $startTime = microtime(true);
            $response = $this->hrChatService->chat($message, $history);
            $endTime = microtime(true);
            $processingTime = round(($endTime - $startTime) * 1000, 2); // in milliseconds

            // تسجيل التفاعل للمراقبة
            Log::info('AI Chat Response Generated', [
                'processing_time_ms' => $processingTime,
                'response_length' => strlen($response),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => true,
                'response' => $response,
                'timestamp' => now()->toISOString(),
                'processing_time_ms' => $processingTime,
                'rate_limit' => [
                    'remaining' => max(0, $maxAttempts - RateLimiter::attempts($key)),
                    'reset_at' => now()->addSeconds(RateLimiter::availableIn($key))->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('AI Chat Controller Error', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'ip' => $request->ip(),
                'message' => $request->input('message')
            ]);

            return response()->json([
                'success' => false,
                'error' => 'عذراً، حدث خطأ في النظام. يرجى المحاولة مرة أخرى.',
                'error_code' => 'CHAT_CONTROLLER_ERROR',
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * اختبار الاتصال مع الذكاء الاصطناعي
     */
    public function testConnection(Request $request)
    {
        try {
            Log::info('Testing AI connection from controller');
            
            $testResult = $this->hrChatService->testConnection();
            
            Log::info('AI connection test completed', ['result' => $testResult]);
            
            return response()->json([
                'success' => $testResult['success'],
                'message' => $testResult['success'] ? 'الاتصال يعمل بنجاح!' : 'فشل في الاتصال',
                'details' => $testResult,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Test connection error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'خطأ في اختبار الاتصال: ' . $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * الحصول على إحصائيات سريعة للـ Dashboard
     */
    public function getStats(Request $request)
    {
        try {
            Log::info('Getting HR stats');
            
            $stats = $this->hrChatService->getQuickStats();

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'generated_at' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Stats Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'خطأ في جلب الإحصائيات: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على اقتراحات أسئلة للمستخدم
     */
    public function getSuggestions(Request $request)
    {
        $suggestions = Cache::remember('chat_suggestions', 3600, function() {
            return [
                'quick_questions' => [
                    'كم عدد الموظفين في الشركة؟',
                    'اعرض الموظفين المتأخرين اليوم',
                    'ما متوسط الراتب في الشركة؟',
                    'كم موظف حضر اليوم؟',
                    'إحصائيات الحضور هذا الشهر'
                ],
                'advanced_queries' => [
                    'اعرض أعلى 5 رواتب في الشركة',
                    'من هم الموظفين الذين لديهم أكثر ساعات إضافية؟',
                    'إحصائيات الغياب حسب كل قسم',
                    'الموظفين الجدد هذا الشهر',
                    'تحليل أداء الحضور للموظفين'
                ],
                'reports' => [
                    'تقرير شامل عن المرتبات',
                    'تقرير الحضور والانصراف الشهري',
                    'تقرير الموظفين مقسم حسب الأقسام',
                    'تحليل الساعات الإضافية والخصومات'
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'suggestions' => $suggestions,
            'generated_at' => now()->toISOString()
        ]);
    }

    /**
     * تنظيف الذاكرة المؤقتة
     */
    public function clearCache(Request $request)
    {
        try {
            Cache::forget('hr_basic_stats');
            Cache::forget('hr_dashboard_stats');
            Cache::forget('chat_suggestions');

            Log::info('Cache cleared successfully', ['ip' => $request->ip()]);

            return response()->json([
                'success' => true,
                'message' => 'تم تنظيف الذاكرة المؤقتة بنجاح',
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Cache clear error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => 'خطأ في تنظيف الذاكرة المؤقتة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * التحقق من حالة النظام
     */
    public function healthCheck(Request $request)
    {
        try {
            // اختبار الاتصال بقاعدة البيانات
            $dbStatus = 'disconnected';
            try {
                DB::connection()->getPdo();
                $dbStatus = 'connected';
            } catch (\Exception $e) {
                Log::error('Database connection failed', ['error' => $e->getMessage()]);
            }
            
            // اختبار الذاكرة المؤقتة
            $cacheStatus = 'failed';
            try {
                Cache::put('health_check', 'ok', 10);
                $cacheStatus = Cache::get('health_check') === 'ok' ? 'working' : 'failed';
                Cache::forget('health_check');
            } catch (\Exception $e) {
                Log::error('Cache test failed', ['error' => $e->getMessage()]);
            }
            
            // اختبار إعدادات OpenRouter
            $openrouterConfigured = config('services.openrouter.api_key') ? 'configured' : 'missing';
            
            // اختبار الاتصال مع OpenRouter
            $aiStatus = 'unknown';
            try {
                $testResult = $this->hrChatService->testConnection();
                $aiStatus = $testResult['success'] ? 'working' : 'failed';
            } catch (\Exception $e) {
                $aiStatus = 'error';
                Log::error('AI test failed', ['error' => $e->getMessage()]);
            }

            $overallStatus = ($dbStatus === 'connected' && $cacheStatus === 'working' && $aiStatus === 'working') ? 'healthy' : 'degraded';

            return response()->json([
                'success' => true,
                'status' => $overallStatus,
                'checks' => [
                    'database' => $dbStatus,
                    'cache' => $cacheStatus,
                    'openrouter_config' => $openrouterConfigured,
                    'ai_service' => $aiStatus,
                    'timestamp' => now()->toISOString()
                ],
                'environment' => [
                    'app_env' => config('app.env'),
                    'app_debug' => config('app.debug'),
                    'php_version' => phpversion(),
                    'laravel_version' => app()->version()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Health check error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * الحصول على تفاصيل النظام للـ Debug
     */
    public function getSystemInfo(Request $request)
    {
        try {
            $systemInfo = [
                'laravel' => [
                    'version' => app()->version(),
                    'environment' => config('app.env'),
                    'debug_mode' => config('app.debug'),
                    'timezone' => config('app.timezone'),
                ],
                'php' => [
                    'version' => phpversion(),
                    'memory_limit' => ini_get('memory_limit'),
                    'max_execution_time' => ini_get('max_execution_time'),
                ],
                'openrouter' => [
                    'api_url' => config('services.openrouter.api_url'),
                    'model' => config('services.openrouter.model'),
                    'max_tokens' => config('services.openrouter.max_tokens'),
                    'temperature' => config('services.openrouter.temperature'),
                    'has_api_key' => !empty(config('services.openrouter.api_key')),
                ],
                'database' => [
                    'connection' => config('database.default'),
                    'host' => config('database.connections.' . config('database.default') . '.host'),
                    'database' => config('database.connections.' . config('database.default') . '.database'),
                ],
                'cache' => [
                    'driver' => config('cache.default'),
                ],
                'logs' => [
                    'channel' => config('logging.default'),
                    'level' => config('logging.level', 'debug'),
                ]
            ];

            return response()->json([
                'success' => true,
                'system_info' => $systemInfo,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'خطأ في جلب معلومات النظام: ' . $e->getMessage()
            ], 500);
        }
    }
}