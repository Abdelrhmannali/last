<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\DB;
use App\Models\Employee;
use App\Models\Attendence;
use App\Models\Payroll;
use App\Models\Department;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class HRChatService
{
    protected $client;
    protected $apiKey;
    protected $apiUrl;
    protected $model;
    protected $maxTokens;
    protected $temperature;

    public function __construct()
    {
        // قراءة الإعدادات من config/services.php
        $config = config('services.openrouter');
        
        $this->apiKey = $config['api_key'];
        $this->apiUrl = $config['api_url'];
        $this->model = $config['model'];
        $this->maxTokens = $config['max_tokens'];
        $this->temperature = $config['temperature'];

        $this->client = new Client([
            'timeout' => $config['timeout'],
            'connect_timeout' => 30,
            'verify' => false,
        ]);

        // تحقق من وجود API Key
        if (!$this->apiKey) {
            throw new \Exception('OPENROUTER_API_KEY غير موجود في ملف .env');
        }

        Log::info('HRChatService initialized', [
            'api_url' => $this->apiUrl,
            'model' => $this->model,
            'has_api_key' => !empty($this->apiKey)
        ]);
    }

    public function chat($message, $conversationHistory = [])
    {
        try {
            Log::info('HR Chat Request Started', [
                'message_preview' => substr($message, 0, 100),
                'history_count' => count($conversationHistory),
                'timestamp' => now()
            ]);

            $systemPrompt = $this->buildHRSystemPrompt();
            
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
                ...$conversationHistory,
                ['role' => 'user', 'content' => $message]
            ];

            Log::info('Sending request to OpenRouter', [
                'url' => $this->apiUrl . '/chat/completions',
                'model' => $this->model,
                'messages_count' => count($messages)
            ]);

            $response = $this->client->post($this->apiUrl . '/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => config('app.name', 'HR Management System')
                ],
                'json' => [
                    'model' => $this->model,
                    'messages' => $messages,
                    'max_tokens' => $this->maxTokens,
                    'temperature' => $this->temperature,
                    'stream' => false
                ]
            ]);

            $statusCode = $response->getStatusCode();
            $responseBody = json_decode($response->getBody(), true);

            Log::info('OpenRouter Response Received', [
                'status_code' => $statusCode,
                'has_choices' => isset($responseBody['choices']),
                'choices_count' => isset($responseBody['choices']) ? count($responseBody['choices']) : 0,
                'usage' => $responseBody['usage'] ?? null
            ]);

            if ($statusCode !== 200) {
                throw new \Exception("HTTP Error: $statusCode - " . ($responseBody['error']['message'] ?? 'Unknown error'));
            }

            if (!isset($responseBody['choices'][0]['message']['content'])) {
                Log::error('Invalid OpenRouter response format', ['response' => $responseBody]);
                throw new \Exception('Invalid response format from OpenRouter API');
            }

            $aiResponse = $responseBody['choices'][0]['message']['content'];
            
            Log::info('AI Response Generated', [
                'response_length' => strlen($aiResponse),
                'contains_sql' => $this->containsSQLRequest($aiResponse)
            ]);

            // تحقق إذا كان الـ AI يريد تنفيذ استعلام
            if ($this->containsSQLRequest($aiResponse)) {
                $queryResult = $this->executeHRQuery($aiResponse);
                $finalResponse = $this->formatResponseWithData($aiResponse, $queryResult);
                
                Log::info('SQL Query Executed', [
                    'has_data' => isset($queryResult['data']),
                    'has_error' => isset($queryResult['error'])
                ]);
                
                return $finalResponse;
            }

            return $aiResponse;
            
        } catch (RequestException $e) {
            $errorMsg = 'Network Error: ' . $e->getMessage();
            $errorDetails = [];
            
            if ($e->hasResponse()) {
                $errorResponse = json_decode($e->getResponse()->getBody(), true);
                $errorMsg .= ' - ' . ($errorResponse['error']['message'] ?? 'Unknown API error');
                $errorDetails = $errorResponse;
            }
            
            Log::error('HR Chat Network Error', [
                'error' => $errorMsg,
                'code' => $e->getCode(),
                'details' => $errorDetails
            ]);
            
            return "عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى خلال دقائق.";
            
        } catch (\Exception $e) {
            Log::error('HR Chat General Error', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // في حالة فشل الـ AI، اعطي إجابة بسيطة مبنية على keywords
            return $this->getFallbackResponse($message);
        }
    }

    protected function buildHRSystemPrompt()
    {
        try {
            $hrSchema = $this->getHRDatabaseSchema();
            $businessContext = $this->getBusinessContext();
            
            return "أنت مساعد ذكي متخصص في نظام إدارة الموارد البشرية. تتحدث باللغة العربية وتجيب بدقة عالية.

📊 **هيكل قاعدة البيانات (الحقول الموجودة فعلياً):**
{$hrSchema}

📋 **السياق التجاري:**
{$businessContext}

⚠️ **قواعد مهمة جداً:**
- لا تُظهر للمستخدم أي SQL code مطلقاً
- استخدم فقط الحقول الموجودة فعلياً في قاعدة البيانات
- لا تخترع أسماء حقول غير موجودة (مثل position, job_title, department_name)
- عند الحاجة لاستعلام، ضع SQL داخل <SQL></SQL> فقط
- استخدم SELECT فقط - لا UPDATE/DELETE/INSERT

🔍 **الحقول المتاحة بالضبط:**
- **employees:** id, first_name, last_name, email, phone, address, salary, hire_date, department_id, working_hours_per_day, salary_per_hour, gender, nationality, national_id, birthdate, default_check_in_time, default_check_out_time
- **departments:** id, dept_name
- **attendances:** id, employee_id, date, checkInTime, checkOutTime, lateDurationInHours, overtimeDurationInHours, status
- **payrolls:** id, employee_id, month, month_days, attended_days, absent_days, total_overtime, total_deduction, net_salary, salary_per_hour

💡 **أمثلة على استعلامات صحيحة:**

للموظفين حسب الأقسام:
<SQL>SELECT d.dept_name, e.first_name, e.last_name, e.salary FROM departments d LEFT JOIN employees e ON d.id = e.department_id ORDER BY d.dept_name, e.first_name</SQL>

لعدد الموظفين:
<SQL>SELECT COUNT(*) as total FROM employees</SQL>

للحضور اليوم:
<SQL>SELECT e.first_name, e.last_name, a.checkInTime, a.status FROM employees e LEFT JOIN attendances a ON e.id = a.employee_id WHERE DATE(a.date) = CURDATE()</SQL>

🎯 **أسلوب الرد المطلوب:**
- ابدأ بعبارة ودية مثل \"دعني أتحقق من ذلك...\"
- كن دقيقاً ومتخصصاً في الموارد البشرية
- اعرض النتائج بتنسيق جميل ومنظم
- اشرح المعلومات بطريقة مفيدة ومهنية
- أضف تعليقات وملاحظات مفيدة حول البيانات
- لا تذكر أي تفاصيل تقنية للمستخدم";

        } catch (\Exception $e) {
            Log::error('Error building system prompt', ['error' => $e->getMessage()]);
            return "أنت مساعد ذكي متخصص في نظام إدارة الموارد البشرية. استخدم فقط الحقول الموجودة في قاعدة البيانات واعرض النتائج بطريقة مهنية.";
        }
    }

    protected function getHRDatabaseSchema()
    {
        return "
🏢 **employees** (جدول الموظفين - الحقول المتاحة):
- id: الرقم التعريفي
- first_name: الاسم الأول  
- last_name: اسم العائلة
- email: البريد الإلكتروني
- phone: رقم الهاتف
- address: العنوان
- salary: الراتب الشهري
- hire_date: تاريخ التوظيف
- department_id: رقم القسم (foreign key للربط مع departments)
- working_hours_per_day: ساعات العمل اليومية
- salary_per_hour: الراتب بالساعة
- gender: الجنس
- nationality: الجنسية  
- national_id: رقم الهوية
- birthdate: تاريخ الميلاد
- default_check_in_time: وقت الحضور الافتراضي
- default_check_out_time: وقت الانصراف الافتراضي

🏛️ **departments** (جدول الأقسام - الحقول المتاحة):
- id: الرقم التعريفي للقسم
- dept_name: اسم القسم

⏰ **attendances** (جدول الحضور - الحقول المتاحة):
- id: الرقم التعريفي
- employee_id: رقم الموظف (foreign key للربط مع employees)
- date: تاريخ الحضور
- checkInTime: وقت الحضور الفعلي
- checkOutTime: وقت الانصراف الفعلي
- lateDurationInHours: ساعات التأخير
- overtimeDurationInHours: ساعات العمل الإضافية
- status: حالة الحضور (present, absent, late, etc.)

💰 **payrolls** (جدول كشوف المرتبات - الحقول المتاحة):
- id: الرقم التعريفي
- employee_id: رقم الموظف (foreign key للربط مع employees)
- month: الشهر
- month_days: عدد أيام الشهر
- attended_days: عدد أيام الحضور
- absent_days: عدد أيام الغياب
- total_overtime: إجمالي الساعات الإضافية
- total_deduction: إجمالي الخصومات
- total_deduction_amount: مبلغ الخصومات
- late_deduction_amount: خصومات التأخير
- absence_deduction_amount: خصومات الغياب
- total_bonus_amount: إجمالي المكافآت
- net_salary: صافي الراتب
- salary_per_hour: الراتب بالساعة

⚠️ **حقول غير موجودة (لا تستخدمها):**
- position, job_title, role في جدول employees
- department_name في أي جدول
- employee_name في أي جدول
- أي حقول أخرى غير مذكورة أعلاه";
    }

    protected function getBusinessContext()
    {
        try {
            $stats = Cache::remember('hr_basic_stats', 300, function() {
                return [
                    'total_employees' => Employee::count(),
                    'total_departments' => Department::count(),
                    'today_attendances' => Attendence::whereDate('date', today())->count(),
                    'this_month_payrolls' => Payroll::whereMonth('created_at', now()->month)->count(),
                ];
            });

            return "
📈 **إحصائيات سريعة:**
- إجمالي الموظفين: {$stats['total_employees']}
- عدد الأقسام: {$stats['total_departments']}
- حضور اليوم: {$stats['today_attendances']}
- كشوف مرتبات هذا الشهر: {$stats['this_month_payrolls']}

📅 **التاريخ الحالي:** " . now()->format('Y-m-d H:i:s') . "
🗓️ **الشهر الحالي:** " . now()->format('F Y');

        } catch (\Exception $e) {
            return "Business context temporarily unavailable.";
        }
    }

    protected function containsSQLRequest($response)
    {
        return preg_match('/<SQL>(.*?)<\/SQL>/s', $response);
    }

    protected function executeHRQuery($response)
    {
        if (preg_match('/<SQL>(.*?)<\/SQL>/s', $response, $matches)) {
            $sql = trim($matches[1]);
            
            Log::info('Executing SQL Query', ['sql' => $sql]);
            
            // أمان: السماح بـ SELECT فقط
            if (!preg_match('/^\s*SELECT\s+/i', $sql)) {
                return ['error' => 'يُسمح باستعلامات SELECT فقط من أجل الأمان'];
            }
            
            try {
                $result = DB::select($sql);
                Log::info('SQL Query Success', ['result_count' => count($result)]);
                return ['data' => $result, 'query' => $sql];
            } catch (\Exception $e) {
                Log::error('SQL Query Error', [
                    'error' => $e->getMessage(),
                    'sql' => $sql
                ]);
                return ['error' => 'خطأ في تنفيذ الاستعلام: ' . $e->getMessage()];
            }
        }
        
        return null;
    }

    protected function formatResponseWithData($response, $queryResult)
    {
        // إزالة أي SQL code من الاستجابة
        $cleanResponse = preg_replace('/<SQL>.*?<\/SQL>/s', '', $response);
        
        // إزالة أي ذكر للـ SQL أو الاستعلامات التقنية
        $cleanResponse = preg_replace('/```sql.*?```/s', '', $cleanResponse);
        $cleanResponse = preg_replace('/SELECT.*?;/si', '', $cleanResponse);
        $cleanResponse = preg_replace('/SQL.*?:/i', '', $cleanResponse);
        
        // تنظيف النص من المسافات الزائدة والنص الزائد المولد من AI
        $cleanResponse = trim(preg_replace('/\s+/', ' ', $cleanResponse));
        
        // إزالة أي نص غير مرغوب فيه من الـ AI
        $cleanResponse = preg_replace('/النتائج المتاحة.*?\|.*?\|/s', '', $cleanResponse);
        $cleanResponse = preg_replace('/\|.*?\|.*?\|.*?\|/s', '', $cleanResponse);
        $cleanResponse = preg_replace('/ملاحظات مهمة:.*?هل تريد/s', '', $cleanResponse);
        
        if (isset($queryResult['error'])) {
            // تحسين رسائل الخطأ لتكون أكثر ودية
            $errorMsg = $queryResult['error'];
            if (strpos($errorMsg, 'Unknown column') !== false) {
                $cleanResponse = "عذراً، حدث خطأ في معالجة طلبك. دعني أعيد المحاولة بطريقة أخرى...";
                
                // محاولة تقديم بديل بسيط
                $fallbackResponse = $this->getFallbackResponseForError($cleanResponse);
                if ($fallbackResponse) {
                    return $fallbackResponse;
                }
            }
            
            return "❌ **عذراً، واجهت صعوبة في جلب هذه البيانات حالياً.** يرجى إعادة صياغة السؤال أو المحاولة مرة أخرى.";
        }
        
        if (isset($queryResult['data'])) {
            $dataText = $this->formatHRQueryResults($queryResult['data']);
            $analysis = $this->addHRInsights($queryResult['data'], $cleanResponse);
            
            // تنظيف الرد وجعله أكثر بساطة
            $finalResponse = "📊 **النتائج:**\n" . $dataText . $analysis;
            
            return $finalResponse;
        }
        
        return $cleanResponse ?: "تم معالجة طلبك بنجاح.";
    }

    protected function getFallbackResponseForError($originalMessage)
    {
        // محاولة تقديم بديل عند حدوث خطأ في SQL
        if (strpos($originalMessage, 'موظفين') !== false && strpos($originalMessage, 'قسم') !== false) {
            try {
                $departments = Department::withCount('employees')->get();
                $response = "🏛️ **الموظفين حسب الأقسام:**\n\n";
                foreach ($departments as $dept) {
                    $employees = Employee::where('department_id', $dept->id)->get();
                    $response .= "📋 **قسم {$dept->dept_name}:** ({$dept->employees_count} موظف)\n";
                    foreach ($employees as $emp) {
                        $response .= "   • {$emp->first_name} {$emp->last_name} - راتب: " . number_format($emp->salary, 0) . " جنيه\n";
                    }
                    $response .= "\n";
                }
                return $response;
            } catch (\Exception $e) {
                return null;
            }
        }
        return null;
    }

    protected function formatHRQueryResults($data)
    {
        if (empty($data)) {
            return "❌ **لا توجد نتائج.**";
        }
        
        if (count($data) === 1 && count((array)$data[0]) === 1) {
            // نتيجة واحدة (مثل عدد أو مجموع)
            $value = array_values((array)$data[0])[0];
            return "✅ **النتيجة:** " . number_format($value, 0) . "\n";
        }
        
        // نتائج متعددة - تنسيق بطريقة منظمة للـ React
        $result = "";
        $headers = array_keys((array)$data[0]);
        $arabicHeaders = $this->translateHeaders($headers);
        
        // إضافة ملخص سريع
        $totalResults = count($data);
        $result .= "🔍 **عدد النتائج:** {$totalResults}\n\n";
        
        // عرض النتائج بتنسيق بطاقات منظم
        foreach (array_slice($data, 0, 10) as $index => $row) {
            $rowData = (array)$row;
            $result .= "📋 **" . ($index + 1) . ".**\n";
            
            // ترتيب الحقول حسب الأهمية
            $orderedFields = $this->getOrderedFields($rowData);
            
            foreach ($orderedFields as $key => $value) {
                $arabicKey = $arabicHeaders[$key] ?? $key;
                $displayValue = $this->formatFieldValue($key, $value);
                
                // استخدام أيقونات مناسبة
                $icon = $this->getFieldIcon($key);
                $result .= "   {$icon} **{$arabicKey}:** {$displayValue}\n";
            }
            $result .= "\n";
        }
        
        if (count($data) > 10) {
            $remaining = count($data) - 10;
            $result .= "📝 *يوجد {$remaining} نتيجة إضافية. يمكنك طلب المزيد إذا كنت تحتاج.*\n";
        }
        
        return $result;
    }

    protected function getOrderedFields($rowData)
    {
        // ترتيب الحقول حسب الأهمية
        $orderedKeys = [
            'first_name', 'last_name', 'dept_name', 'email', 'phone', 
            'salary', 'hire_date', 'working_hours_per_day', 'salary_per_hour',
            'address', 'gender', 'nationality', 'birthdate',
            'checkInTime', 'checkOutTime', 'status', 'date',
            'lateDurationInHours', 'overtimeDurationInHours',
            'net_salary', 'total_overtime', 'total_deduction'
        ];
        
        $ordered = [];
        
        // إضافة الحقول المرتبة أولاً
        foreach ($orderedKeys as $key) {
            if (array_key_exists($key, $rowData)) {
                $ordered[$key] = $rowData[$key];
            }
        }
        
        // إضافة أي حقول متبقية
        foreach ($rowData as $key => $value) {
            if (!array_key_exists($key, $ordered)) {
                $ordered[$key] = $value;
            }
        }
        
        return $ordered;
    }

    protected function formatFieldValue($key, $value)
    {
        if ($value === null || $value === '') {
            return '`غير محدد`';
        }
        
        // تنسيق خاص للحقول المختلفة
        switch ($key) {
            case 'salary':
            case 'net_salary':
            case 'salary_per_hour':
                return number_format($value, 0) . ' جنيه';
                
            case 'hire_date':
            case 'birthdate':
            case 'date':
                return date('d/m/Y', strtotime($value));
                
            case 'checkInTime':
            case 'checkOutTime':
                return date('H:i', strtotime($value));
                
            case 'lateDurationInHours':
            case 'overtimeDurationInHours':
            case 'working_hours_per_day':
                return $value . ' ساعة';
                
            case 'status':
                $statusMap = [
                    'present' => '✅ حاضر',
                    'absent' => '❌ غائب',
                    'late' => '⏰ متأخر',
                    'early_leave' => '🚪 انصراف مبكر'
                ];
                return $statusMap[$value] ?? $value;
                
            case 'gender':
                $genderMap = [
                    'male' => '👨 ذكر',
                    'female' => '👩 أنثى'
                ];
                return $genderMap[$value] ?? $value;
                
            case 'email':
                return "`{$value}`";
                
            default:
                return $value;
        }
    }

    protected function getFieldIcon($key)
    {
        $icons = [
            'first_name' => '👤',
            'last_name' => '👤',
            'dept_name' => '🏢',
            'email' => '📧',
            'phone' => '📱',
            'salary' => '💰',
            'hire_date' => '📅',
            'working_hours_per_day' => '⏱️',
            'address' => '🏠',
            'birthdate' => '🎂',
            'checkInTime' => '🕐',
            'checkOutTime' => '🕕',
            'status' => '📊',
            'lateDurationInHours' => '⏰',
            'overtimeDurationInHours' => '➕',
            'net_salary' => '💵',
            'nationality' => '🌍',
            'national_id' => '🆔'
        ];
        
        return $icons[$key] ?? '•';
    }

    protected function translateHeaders($headers)
    {
        $translations = [
            'id' => 'الرقم التعريفي',
            'first_name' => 'الاسم الأول',
            'last_name' => 'اسم العائلة',
            'full_name' => 'الاسم الكامل',
            'email' => 'البريد الإلكتروني',
            'phone' => 'رقم الهاتف',
            'address' => 'العنوان',
            'salary' => 'الراتب',
            'hire_date' => 'تاريخ التوظيف',
            'department_id' => 'رقم القسم',
            'dept_name' => 'اسم القسم',
            'working_hours_per_day' => 'ساعات العمل اليومية',
            'salary_per_hour' => 'الراتب بالساعة',
            'gender' => 'الجنس',
            'nationality' => 'الجنسية',
            'national_id' => 'رقم الهوية',
            'birthdate' => 'تاريخ الميلاد',
            'date' => 'التاريخ',
            'checkInTime' => 'وقت الحضور',
            'checkOutTime' => 'وقت الانصراف',
            'lateDurationInHours' => 'ساعات التأخير',
            'overtimeDurationInHours' => 'ساعات إضافية',
            'status' => 'الحالة',
            'month' => 'الشهر',
            'month_days' => 'أيام الشهر',
            'attended_days' => 'أيام الحضور',
            'absent_days' => 'أيام الغياب',
            'total_overtime' => 'إجمالي الساعات الإضافية',
            'total_deduction' => 'إجمالي الخصومات',
            'net_salary' => 'صافي الراتب',
            'count' => 'العدد',
            'total' => 'الإجمالي',
            'average' => 'المتوسط',
            'max' => 'الأعلى',
            'min' => 'الأقل'
        ];
        
        $result = [];
        foreach ($headers as $header) {
            $result[$header] = $translations[$header] ?? $header;
        }
        
        return $result;
    }

    protected function addHRInsights($data, $context)
    {
        if (empty($data)) {
            return "";
        }
        
        $insights = "\n💡 **تحليل سريع:**\n";
        
        // تحليل بناءً على نوع البيانات
        if (strpos($context, 'موظف') !== false || strpos($context, 'قسم') !== false) {
            $employeeCount = 0;
            $departments = [];
            $totalSalary = 0;
            $salaryCount = 0;
            
            foreach ($data as $row) {
                $row = (array)$row;
                
                if (!empty($row['first_name'])) {
                    $employeeCount++;
                }
                
                if (!empty($row['dept_name']) && !in_array($row['dept_name'], $departments)) {
                    $departments[] = $row['dept_name'];
                }
                
                if (isset($row['salary']) && is_numeric($row['salary']) && $row['salary'] > 0) {
                    $totalSalary += $row['salary'];
                    $salaryCount++;
                }
            }
            
            if ($employeeCount > 0) {
                $insights .= "👥 **إجمالي الموظفين:** {$employeeCount}\n";
            }
            
            if (!empty($departments)) {
                $insights .= "🏢 **الأقسام:** " . implode(', ', $departments) . "\n";
            }
            
            if ($salaryCount > 0) {
                $avgSalary = $totalSalary / $salaryCount;
                $insights .= "💰 **متوسط الراتب:** " . number_format($avgSalary, 0) . " جنيه\n";
            }
        }
        
        // تحليل بيانات الحضور
        if (strpos($context, 'حضور') !== false || isset($data[0]->status)) {
            $presentCount = 0;
            $lateCount = 0;
            $totalCount = 0;
            
            foreach ($data as $row) {
                $row = (array)$row;
                if (isset($row['status'])) {
                    $totalCount++;
                    if ($row['status'] === 'present') $presentCount++;
                    if ($row['status'] === 'late') $lateCount++;
                }
            }
            
            if ($totalCount > 0) {
                $presentPercentage = round(($presentCount / $totalCount) * 100, 1);
                $insights .= "✅ **نسبة الحضور:** {$presentPercentage}%\n";
                
                if ($lateCount > 0) {
                    $insights .= "⏰ **عدد المتأخرين:** {$lateCount}\n";
                }
            }
        }
        
        // تحليل بيانات الرواتب
        if (strpos($context, 'راتب') !== false || isset($data[0]->net_salary)) {
            $salaries = [];
            $totalDeductions = 0;
            $totalOvertime = 0;
            
            foreach ($data as $row) {
                $row = (array)$row;
                
                if (isset($row['net_salary']) && is_numeric($row['net_salary'])) {
                    $salaries[] = $row['net_salary'];
                }
                
                if (isset($row['total_deduction']) && is_numeric($row['total_deduction'])) {
                    $totalDeductions += $row['total_deduction'];
                }
                
                if (isset($row['total_overtime']) && is_numeric($row['total_overtime'])) {
                    $totalOvertime += $row['total_overtime'];
                }
            }
            
            if (!empty($salaries)) {
                $maxSalary = max($salaries);
                $minSalary = min($salaries);
                $insights .= "📈 **أعلى راتب:** " . number_format($maxSalary, 0) . " جنيه\n";
                $insights .= "📉 **أقل راتب:** " . number_format($minSalary, 0) . " جنيه\n";
            }
            
            if ($totalOvertime > 0) {
                $insights .= "➕ **إجمالي الساعات الإضافية:** {$totalOvertime} ساعة\n";
            }
        }
        
        return $insights;
    }

    protected function getFallbackResponse($message)
    {
        $message = strtolower(trim($message));
        
        // إجابات بسيطة للأسئلة الشائعة
        if (strpos($message, 'عدد الموظفين') !== false || strpos($message, 'كم موظف') !== false) {
            try {
                $count = Employee::count();
                return "📊 **إجمالي عدد الموظفين:** {$count} موظف";
            } catch (\Exception $e) {
                return "عذراً، لا أستطيع الوصول لبيانات الموظفين حالياً.";
            }
        }
        
        if (strpos($message, 'الأقسام') !== false || strpos($message, 'قسم') !== false) {
            try {
                $departments = Department::withCount('employees')->get();
                $response = "🏛️ **الأقسام والموظفين:**\n\n";
                foreach ($departments as $dept) {
                    $response .= "📋 **قسم {$dept->dept_name}:** {$dept->employees_count} موظف\n";
                }
                return $response;
            } catch (\Exception $e) {
                return "عذراً، لا أستطيع الوصول لبيانات الأقسام حالياً.";
            }
        }
        
        if (strpos($message, 'راتب') !== false || strpos($message, 'متوسط') !== false) {
            try {
                $avgSalary = Employee::avg('salary');
                return "💰 **متوسط الراتب:** " . number_format($avgSalary, 2) . " جنيه";
            } catch (\Exception $e) {
                return "عذراً، لا أستطيع حساب متوسط الراتب حالياً.";
            }
        }
        
        if (strpos($message, 'حضور') !== false || strpos($message, 'اليوم') !== false) {
            try {
                $todayAttendance = Attendence::whereDate('date', today())->count();
                $totalEmployees = Employee::count();
                $percentage = $totalEmployees > 0 ? round(($todayAttendance / $totalEmployees) * 100, 1) : 0;
                return "⏰ **حضور اليوم:** {$todayAttendance} من أصل {$totalEmployees} موظف ({$percentage}%)";
            } catch (\Exception $e) {
                return "عذراً، لا أستطيع جلب بيانات الحضور حالياً.";
            }
        }
        
        return "🤖 أهلاً بك! يمكنني مساعدتك في:\n\n" .
               "📊 **معلومات الموظفين:** عدد الموظفين، الأقسام، الرواتب\n" .
               "⏰ **بيانات الحضور:** الحضور اليومي، التأخير، الساعات الإضافية\n" .
               "💰 **كشوف المرتبات:** الرواتب، الخصومات، المكافآت\n" .
               "📈 **التقارير والإحصائيات:** تحليلات مختلفة\n\n" .
               "مثال: اكتب \"كم عدد الموظفين؟\" أو \"اعرض الأقسام\"";
    }

    public function getQuickStats()
    {
        try {
            return Cache::remember('hr_dashboard_stats', 300, function() {
                return [
                    'employees' => [
                        'total' => Employee::count(),
                        'active' => Employee::whereNotNull('hire_date')->count(),
                        'by_department' => Employee::join('departments', 'employees.department_id', '=', 'departments.id')
                                                   ->select('departments.dept_name', DB::raw('count(*) as count'))
                                                   ->groupBy('departments.dept_name')
                                                   ->get()->toArray()
                    ],
                    'attendance_today' => [
                        'total' => Attendence::whereDate('date', today())->count(),
                        'present' => Attendence::whereDate('date', today())->where('status', 'present')->count(),
                        'late' => Attendence::whereDate('date', today())->where('lateDurationInHours', '>', 0)->count(),
                    ],
                    'payroll_this_month' => [
                        'processed' => Payroll::whereMonth('created_at', now()->month)->count(),
                        'total_amount' => (float) Payroll::whereMonth('created_at', now()->month)->sum('net_salary'),
                    ]
                ];
            });
        } catch (\Exception $e) {
            Log::error('Error getting quick stats', ['error' => $e->getMessage()]);
            return [
                'error' => 'Unable to fetch statistics at this time'
            ];
        }
    }

    // Method للاختبار البسيط
    public function testConnection()
    {
        try {
            Log::info('Testing OpenRouter connection');
            
            $response = $this->client->post($this->apiUrl . '/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'user', 'content' => 'قل "مرحبا" فقط']
                    ],
                    'max_tokens' => 10
                ]
            ]);

            $responseBody = json_decode($response->getBody(), true);
            
            Log::info('Test connection successful', ['response' => $responseBody]);
            
            return [
                'success' => true,
                'response' => $responseBody['choices'][0]['message']['content'] ?? 'No response',
                'model' => $responseBody['model'] ?? $this->model
            ];

        } catch (\Exception $e) {
            Log::error('Test connection failed', ['error' => $e->getMessage()]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}