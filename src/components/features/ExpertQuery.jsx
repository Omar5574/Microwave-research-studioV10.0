import React, { useState } from 'react';
import ExpertQuery from './components/features/ExpertQuery'; // تأكد أن المسار صحيح لملفك
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. تعريف الموديل باستخدام المفتاح الذي وضعناه في ملف .env
// إذا كنت تستخدم Create React App استبدل import.meta.env بـ process.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);

function SimulationPage() {
  // حالة للتحكم في ظهور الشات
  const [showChat, setShowChat] = useState(false);
  // حالة لتخزين المحادثة (سؤالك وإجابة الذكاء الاصطناعي)
  const [chatHistory, setChatHistory] = useState([]);
  // حالة التحميل (لإظهار كلمة "جاري التحليل...")
  const [loading, setLoading] = useState(false);

  // هذه هي الدالة التي ستنفذ عندما تضغط "إرسال"
  const handleQuery = async (userQuestion) => {
    // لا ترسل إذا كان السؤال فارغاً أو لا يوجد مفتاح
    if (!userQuestion || !API_KEY) {
      alert("تأكد من وجود مفتاح API في ملف .env");
      return;
    }

    setLoading(true);

    // 1. أضف سؤالك فوراً للشاشة
    const newHistory = [...chatHistory, { role: 'user', text: userQuestion }];
    setChatHistory(newHistory);

    try {
      // 2. اختيار الموديل (gemini-pro هو الأفضل للنصوص حالياً)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // 3. (اختياري) تخصيص شخصية الموديل ليكون مهندس اتصالات
      const contextPrompt = `
        أنت مساعد ذكي متخصص في هندسة الموجات الدقيقة (Microwave Engineering).
        الطالب يسأل عن جهاز: Gunn Diode.
        اشرح بأسلوب علمي هندسي دقيق ومختصر.
        استخدم المعادلات الرياضية بصيغة LaTeX (بين علامات $$) إذا لزم الأمر.
        السؤال هو: ${userQuestion}
      `;

      // 4. إرسال السؤال لجوجل
      const result = await model.generateContent(contextPrompt);
      const response = await result.response;
      const text = response.text();

      // 5. أضف إجابة الموديل للشاشة
      setChatHistory(prev => [...prev, { role: 'model', text: text }]);

    } catch (error) {
      console.error("Error:", error);
      setChatHistory(prev => [...prev, { role: 'model', text: "حدث خطأ في الاتصال، حاول مرة أخرى." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', background: '#0f172a', position: 'relative' }}>
      
      {/* هنا باقي كود المحاكاة والرسومات الخاصة بك */}
      <h1 className="text-white text-center pt-10">Gunn Diode Simulation</h1>

      {/* زر لفتح الشات */}
      <button 
        onClick={() => setShowChat(true)}
        className="fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-500 transition"
      >
        اسأل الخبير 🤖
      </button>

      {/* استدعاء المكون الذي صممته أنت وتمرير البيانات له */}
      <ExpertQuery
        show={showChat}
        onClose={() => setShowChat(false)}
        onQuery={handleQuery}      // تمرير دالة الربط
        loading={loading}          // تمرير حالة التحميل
        deviceName="Gunn Diode"
        history={chatHistory}      // تمرير سجل المحادثة
        currentInputs="V=12V"      // (اختياري) لعرض القيم الحالية
      />
    </div>
  );
}

export default SimulationPage;
