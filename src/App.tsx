import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Book, MessageCircle, Briefcase, Clock, Globe, X, CheckCircle, ChevronRight, GraduationCap, Sparkles, Send, Bot, Trophy } from 'lucide-react';

// --- Type Definitions ---
interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number; // Index ของข้อที่ถูก (เริ่มที่ 0)
}

interface Topic {
  title: string;
  desc: string;
  content: string;
  quiz: Quiz;
}

interface CurriculumStage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: ReactNode;
  color: string;
  topics: Topic[];
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- Gemini API Config ---
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
const apiKey = "AIzaSyAMY4U8Zd81A2NcPYOiujdZoepv_pGh2V0"; // ⚠️ อย่าลืมใส่ API Key ของคุณตรงนี้ (AIza...)

// --- Helper: Exponential Backoff Fetch ---
async function fetchWithBackoff(url: string, options: RequestInit, retries = 5, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok && retries > 0 && response.status === 429) {
      throw new Error("Too many requests");
    }
    return response;
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithBackoff(url, options, retries - 1, delay * 2);
  }
}

// --- Styles injection component ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap');
    body { 
      font-family: 'Sarabun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f7f9; 
      margin: 0;
      color: #333;
    }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; }
    ::-webkit-scrollbar-thumb { background: #2bb6c4; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #0b7a8a; }
    @keyframes slideIn { 
      from { opacity: 0; transform: translateY(20px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    .modal-animate { animation: slideIn 0.3s ease-out forwards; }
    .gradient-header {
      background: linear-gradient(90deg, #2bb6c4, #37d2b0);
    }
    .chat-bubble-user {
        background-color: #2bb6c4;
        color: white;
        border-radius: 18px 18px 4px 18px;
    }
    .chat-bubble-ai {
        background-color: #f3f4f6;
        color: #374151;
        border-radius: 18px 18px 18px 4px;
        border: 1px solid #e5e7eb;
    }
    .typing-dot {
      animation: typing 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `}</style>
);

// --- Curriculum Data with Quizzes ---
const curriculumData: CurriculumStage[] = [
  {
    id: 1,
    title: "Stage 1: The Foundation",
    subtitle: "ปูพื้นฐาน 0-20%",
    description: "รากฐานที่มั่นคงคือกุญแจสำคัญ เริ่มต้นจากเสียงและการสร้างประโยคแรก",
    icon: <Book size={28} className="text-white" />,
    color: "from-teal-400 to-teal-500",
    topics: [
      {
        title: "A-Z & Phonics",
        desc: "การออกเสียงที่ถูกต้อง ไม่ใช่แค่ท่องจำ",
        content: `
          <div class="space-y-4">
            <p class="text-lg">ทำไมต้อง <strong>Phonics</strong>? เพราะภาษาอังกฤษไม่ได้อ่านตรงตัวเสมอไป</p>
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 class="font-bold text-blue-700 mb-2">ตัวอย่างเสียงที่คนไทยมักสับสน</h4>
              <ul class="space-y-2">
                <li>🅰️ <strong>A (แอะ):</strong> Ant (มด), Cat (แมว) <span class="text-gray-500 text-sm">- ไม่ใช่สระเอ</span></li>
                <li>🇨 <strong>C (เคอะ):</strong> Cup (ถ้วย), Cat (แมว) <span class="text-gray-500 text-sm">- เสียง ค.ควาย</span></li>
                <li>🐍 <strong>S (สึ):</strong> Snake (งู) <span class="text-gray-500 text-sm">- ต้องมีเสียงลมลอดฟัน</span></li>
              </ul>
            </div>
            <p><strong>Tip:</strong> ลองฝึกออกเสียงพยัญชนะต้นและตัวสะกดให้ชัดเจน เช่น "Cat" ต้องมีเสียง "ทึ" เบาๆ ตอนท้าย</p>
          </div>
        `,
        quiz: {
          question: "ตัว C ในคำว่า 'Cat' ออกเสียงว่าอย่างไร?",
          options: ["ซี (Sea)", "เคอะ (Kuh)", "จี (Gee)", "แอ (Ah)"],
          correctAnswer: 1
        }
      },
      {
        title: "Greetings & Introductions",
        desc: "การทักทายและแนะนำตัวแบบธรรมชาติ",
        content: `
          <div class="space-y-4">
            <p>เริ่มบทสนทนาง่ายๆ ด้วยคำเหล่านี้:</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white border p-3 rounded-lg text-center shadow-sm">
                <div class="text-2xl mb-1">👋</div>
                <strong class="text-teal-600">Hello / Hi</strong>
                <p class="text-xs text-gray-500">สวัสดี (ทางการ / กันเอง)</p>
              </div>
              <div class="bg-white border p-3 rounded-lg text-center shadow-sm">
                <div class="text-2xl mb-1">🌞</div>
                <strong class="text-teal-600">Good Morning</strong>
                <p class="text-xs text-gray-500">สวัสดีตอนเช้า</p>
              </div>
            </div>
            <div class="bg-teal-50 p-4 rounded-lg mt-2">
              <h4 class="font-bold text-teal-800 mb-2">Patterns การแนะนำตัว:</h4>
              <p class="mb-1">🗣️ "My name is <strong>[Name]</strong>." (ฉันชื่อ...)</p>
              <p class="mb-1">🌏 "I am from <strong>Thailand</strong>." (ฉันมาจากประเทศไทย)</p>
              <p>🤝 "Nice to meet you." (ยินดีที่ได้รู้จัก)</p>
            </div>
          </div>
        `,
        quiz: {
          question: "ถ้าต้องการทักทายเพื่อนสนิท ควรใช้คำว่าอะไร?",
          options: ["Good Morning", "Nice to meet you", "Hi", "Goodbye"],
          correctAnswer: 2
        }
      },
      {
        title: "Subject Pronouns",
        desc: "I, You, We, They, He, She, It",
        content: `
          <p class="mb-3">คำสรรพนามใช้เรียกแทนชื่อคน สัตว์ สิ่งของ ต้องแม่นยำ!</p>
          <div class="overflow-hidden rounded-lg border border-gray-200">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-100 text-gray-700">
                <tr><th class="p-2">คำศัพท์</th><th class="p-2">ความหมาย</th><th class="p-2">ใช้กับ</th></tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr><td class="p-2 font-bold text-center">I</td><td class="p-2">ฉัน</td><td class="p-2">ผู้พูด</td></tr>
                <tr><td class="p-2 font-bold text-center">You</td><td class="p-2">คุณ</td><td class="p-2">คู่สนทนา</td></tr>
                <tr><td class="p-2 font-bold text-center">He</td><td class="p-2">เขา (ชาย)</td><td class="p-2">คนอื่น 1 คน</td></tr>
                <tr><td class="p-2 font-bold text-center">She</td><td class="p-2">เธอ (หญิง)</td><td class="p-2">คนอื่น 1 คน</td></tr>
                <tr><td class="p-2 font-bold text-center">It</td><td class="p-2">มัน</td><td class="p-2">สัตว์/สิ่งของ</td></tr>
                <tr><td class="p-2 font-bold text-center">We</td><td class="p-2">พวกเรา</td><td class="p-2">ฉัน + คนอื่น</td></tr>
                <tr><td class="p-2 font-bold text-center">They</td><td class="p-2">พวกเขา</td><td class="p-2">คนอื่นหลายคน</td></tr>
              </tbody>
            </table>
          </div>
        `,
        quiz: {
          question: "ถ้าจะพูดถึง 'พวกเรา' ต้องใช้คำไหน?",
          options: ["They", "We", "You", "She"],
          correctAnswer: 1
        }
      },
      {
        title: "Verb to Be",
        desc: "is, am, are หัวใจสำคัญ",
        content: `
          <p class="mb-3">แปลว่า <strong>เป็น, อยู่, คือ</strong> กฎเหล็กที่ต้องจำให้ขึ้นใจ:</p>
          <div class="space-y-2">
            <div class="flex items-center p-2 bg-red-50 rounded border-l-4 border-red-400">
              <span class="font-bold mr-2">I</span> 
              <span class="text-gray-500 mr-2">คู่กับ</span> 
              <span class="font-bold text-red-600 bg-white px-2 py-0.5 rounded shadow-sm">am</span> 
              <span class="ml-auto text-sm">I am a student.</span>
            </div>
            <div class="flex items-center p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <span class="font-bold mr-2">He/She/It</span> 
              <span class="text-gray-500 mr-2">คู่กับ</span> 
              <span class="font-bold text-blue-600 bg-white px-2 py-0.5 rounded shadow-sm">is</span> 
              <span class="ml-auto text-sm">She is happy.</span>
            </div>
            <div class="flex items-center p-2 bg-green-50 rounded border-l-4 border-green-400">
              <span class="font-bold mr-2">You/We/They</span> 
              <span class="text-gray-500 mr-2">คู่กับ</span> 
              <span class="font-bold text-green-600 bg-white px-2 py-0.5 rounded shadow-sm">are</span> 
              <span class="ml-auto text-sm">We are friends.</span>
            </div>
          </div>
        `,
        quiz: {
          question: "เติมคำในช่องว่าง: She ... a doctor.",
          options: ["am", "are", "is", "be"],
          correctAnswer: 2
        }
      }
    ]
  },
  {
    id: 2,
    title: "Stage 2: Basic Sentences",
    subtitle: "เริ่มแต่งประโยค 21-40%",
    description: "เริ่มนำคำศัพท์มาร้อยเรียงเป็นประโยคที่สมบูรณ์",
    icon: <MessageCircle size={28} className="text-white" />,
    color: "from-emerald-400 to-emerald-500",
    topics: [
      {
        title: "Nouns & Plurals",
        desc: "คำนามและกฎการเติม s/es",
        content: `
          <p><strong>Noun (คำนาม)</strong> คือ คน สัตว์ สิ่งของ สถานที่</p>
          <div class="mt-3 bg-white p-3 rounded border border-gray-200 shadow-sm">
            <h4 class="font-bold mb-2">กฎการเปลี่ยนเป็นพหูพจน์ (Plural):</h4>
            <ul class="list-disc pl-5 space-y-1 text-sm">
              <li>เติม <strong>s</strong> ทั่วไป: Cat → Cats</li>
              <li>เติม <strong>es</strong> (ท้าย s, x, ch, sh): Box → Boxes</li>
              <li>เปลี่ยน <strong>y</strong> เป็น <strong>i</strong> เติม <strong>es</strong>: Baby → Babies</li>
              <li>เปลี่ยนรูป: Man → Men, Child → Children</li>
            </ul>
          </div>
        `,
        quiz: {
          question: "แมว 2 ตัว เขียนเป็นภาษาอังกฤษว่าอย่างไร?",
          options: ["Cat", "Cates", "Cats", "Cat's"],
          correctAnswer: 2
        }
      },
      {
        title: "Action Verbs",
        desc: "คำกริยาพื้นฐาน กิน, เดิน, นอน",
        content: `
          <p class="mb-3">คำศัพท์กริยาที่ต้องรู้เพื่อบอกการกระทำ:</p>
          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div class="bg-emerald-50 p-2 rounded hover:bg-emerald-100 transition">🍕 Eat (กิน)</div>
            <div class="bg-emerald-50 p-2 rounded hover:bg-emerald-100 transition">🥤 Drink (ดื่ม)</div>
            <div class="bg-emerald-50 p-2 rounded hover:bg-emerald-100 transition">😴 Sleep (นอน)</div>
            <div class="bg-emerald-50 p-2 rounded hover:bg-emerald-100 transition">🚶 Walk (เดิน)</div>
            <div class="bg-emerald-50 p-2 rounded hover:bg-emerald-100 transition">🏃 Run (วิ่ง)</div>
            <div class="bg-emerald-50 p-2 rounded hover:bg-emerald-100 transition">💼 Work (ทำงาน)</div>
          </div>
          <p class="mt-3 text-center italic text-gray-600">"I <strong>eat</strong> pizza every day."</p>
        `,
        quiz: {
          question: "คำว่า 'เดิน' ภาษาอังกฤษคือ?",
          options: ["Run", "Walk", "Sleep", "Eat"],
          correctAnswer: 1
        }
      },
      {
        title: "Present Simple Tense",
        desc: "พูดถึงความจริงและกิจวัตร",
        content: `
          <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-3">
            <p class="font-bold text-center">Subject + Verb 1</p>
          </div>
          <p>ใช้พูดถึงเรื่องจริง หรือสิ่งที่ทำเป็นประจำ</p>
          <div class="mt-2 p-3 bg-white rounded border-l-4 border-red-400 shadow-sm">
            <strong>⚠️ กฎสำคัญ:</strong><br>
            ถ้าประธานเป็น He, She, It กริยาต้องเติม s หรือ es<br>
            <span class="text-red-500">❌ He play football.</span><br>
            <span class="text-green-600">✅ He <strong>plays</strong> football.</span>
          </div>
        `,
        quiz: {
          question: "ข้อใดถูกต้อง?",
          options: ["She walk to school.", "She walks to school.", "She walking to school.", "She walkes to school."],
          correctAnswer: 1
        }
      },
      {
        title: "Numbers, Days, Months",
        desc: "ตัวเลข วัน เดือน เวลา",
        content: `
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="font-bold text-teal-600">Days</h4>
              <ul class="text-sm list-disc pl-4 text-gray-600">
                <li>Sunday, Monday</li>
                <li>Tuesday, Wednesday</li>
                <li>Thursday, Friday</li>
                <li>Saturday</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-teal-600">Numbers</h4>
              <ul class="text-sm list-disc pl-4 text-gray-600">
                <li>11: Eleven</li>
                <li>12: Twelve</li>
                <li>20: Twenty</li>
                <li>100: One hundred</li>
              </ul>
            </div>
          </div>
        `,
        quiz: {
          question: "Twelve คือเลขอะไร?",
          options: ["11", "12", "20", "21"],
          correctAnswer: 1
        }
      }
    ]
  },
  {
    id: 3,
    title: "Stage 3: Daily Life",
    subtitle: "ชีวิตประจำวัน 41-60%",
    description: "ขยายความสามารถในการบรรยายสิ่งรอบตัวและตั้งคำถาม",
    icon: <Briefcase size={28} className="text-white" />,
    color: "from-cyan-400 to-cyan-500",
    topics: [
      { 
        title: "Adjectives", 
        desc: "คำคุณศัพท์ บอกสี ขนาด อารมณ์", 
        content: `
          <p>คำคุณศัพท์ (Adjective) ทำหน้าที่ขยายคำนาม วางได้ 2 ตำแหน่ง:</p>
          <ol class="list-decimal pl-5 mt-2 space-y-2">
            <li><strong>หน้าคำนาม:</strong> A <span class="text-pink-500 font-bold">red</span> car (รถสีแดง)</li>
            <li><strong>หลัง Verb to be:</strong> She is <span class="text-pink-500 font-bold">beautiful</span> (เธอสวย)</li>
          </ol>
          <div class="mt-3 flex gap-2 flex-wrap">
            <span class="px-2 py-1 bg-gray-100 rounded text-xs">Big ใหญ่</span>
            <span class="px-2 py-1 bg-gray-100 rounded text-xs">Small เล็ก</span>
            <span class="px-2 py-1 bg-gray-100 rounded text-xs">Happy สุข</span>
            <span class="px-2 py-1 bg-gray-100 rounded text-xs">Sad เศร้า</span>
          </div>
        `,
        quiz: {
          question: "ประโยคไหนใช้ Adjective ถูกต้อง?",
          options: ["A car red.", "A red car.", "Car is red a.", "Red is a car."],
          correctAnswer: 1
        }
      },
      { 
        title: "Prepositions", 
        desc: "in, on, at, under บอกตำแหน่ง", 
        content: `
          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="p-2 border rounded bg-white">
              <strong class="text-cyan-600 block">IN (ใน)</strong>
              <span class="text-sm text-gray-500">In the box</span>
            </div>
            <div class="p-2 border rounded bg-white">
              <strong class="text-cyan-600 block">ON (บน)</strong>
              <span class="text-sm text-gray-500">On the table</span>
            </div>
            <div class="p-2 border rounded bg-white">
              <strong class="text-cyan-600 block">AT (ที่)</strong>
              <span class="text-sm text-gray-500">At school</span>
            </div>
            <div class="p-2 border rounded bg-white">
              <strong class="text-cyan-600 block">UNDER (ใต้)</strong>
              <span class="text-sm text-gray-500">Under the chair</span>
            </div>
          </div>
        `,
        quiz: {
          question: "แมวนอนอยู่ ... (บน) โต๊ะ",
          options: ["in", "at", "under", "on"],
          correctAnswer: 3
        }
      },
      { 
        title: "Question Words", 
        desc: "Who, What, Where, When, Why, How", 
        content: `
          <ul class="space-y-2 bg-white p-3 rounded border border-gray-100">
            <li>👤 <strong>Who (ใคร):</strong> Who is he?</li>
            <li>🍎 <strong>What (อะไร):</strong> What is this?</li>
            <li>📍 <strong>Where (ที่ไหน):</strong> Where do you live?</li>
            <li>⏰ <strong>When (เมื่อไหร่):</strong> When is your birthday?</li>
            <li>❓ <strong>Why (ทำไม):</strong> Why do you cry?</li>
            <li>🛠️ <strong>How (อย่างไร):</strong> How are you?</li>
          </ul>
        `,
        quiz: {
          question: "ถ้าอยากถามเกี่ยวกับ 'สถานที่' ต้องใช้คำไหน?",
          options: ["Who", "What", "Where", "When"],
          correctAnswer: 2
        }
      },
      { 
        title: "Daily Routine", 
        desc: "เล่ากิจวัตรประจำวัน", 
        content: `
          <p>คำศัพท์ที่ใช้บ่อยในการเล่าเรื่องตัวเอง:</p>
          <div class="mt-2 space-y-1 text-sm">
            <p>🌅 <strong>Wake up:</strong> ตื่นนอน</p>
            <p>🚿 <strong>Take a shower:</strong> อาบน้ำ</p>
            <p>🦷 <strong>Brush teeth:</strong> แปรงฟัน</p>
            <p>🚗 <strong>Go to work:</strong> ไปทำงาน</p>
            <p>🏠 <strong>Go home:</strong> กลับบ้าน</p>
            <p>🛌 <strong>Go to bed:</strong> เข้านอน</p>
          </div>
        `,
        quiz: {
          question: "'Go to bed' แปลว่าอะไร?",
          options: ["ตื่นนอน", "ไปทำงาน", "เข้านอน", "ไปซื้อเตียง"],
          correctAnswer: 2
        }
      }
    ]
  },
  {
    id: 4,
    title: "Stage 4: Time Travel",
    subtitle: "อดีตและอนาคต 61-80%",
    description: "ปลดล็อกความสามารถในการเล่าเรื่องในอดีตและวางแผนอนาคต",
    icon: <Clock size={28} className="text-white" />,
    color: "from-indigo-400 to-indigo-500",
    topics: [
      { 
        title: "Past Simple Tense", 
        desc: "เล่าเรื่องในอดีต (Verb 2)", 
        content: `
          <p>ใช้เล่าเรื่องที่<strong>จบไปแล้ว</strong> โครงสร้างคือ Subject + <strong>Verb ช่อง 2</strong></p>
          <div class="mt-3 p-3 bg-indigo-50 rounded border border-indigo-100">
            <h4 class="font-bold text-indigo-700">การเปลี่ยนรูป Verb:</h4>
            <ul class="list-disc pl-5 mt-1 text-sm">
              <li>ปกติเติม <strong>ed</strong>: Walk → Walk<strong>ed</strong></li>
              <li>เปลี่ยนรูป (Irregular): Go → <strong>Went</strong>, Eat → <strong>Ate</strong></li>
            </ul>
            <p class="mt-2 text-sm italic">"I <strong>went</strong> to the market yesterday."</p>
          </div>
        `,
        quiz: {
          question: "รูปอดีต (V.2) ของ 'Go' คือ?",
          options: ["Goed", "Gone", "Went", "Going"],
          correctAnswer: 2
        }
      },
      { 
        title: "Future Tense", 
        desc: "Will vs Going to", 
        content: `
          <div class="grid grid-cols-1 gap-2">
            <div class="p-3 bg-white border-l-4 border-blue-400 rounded shadow-sm">
              <strong class="text-blue-600">Will</strong> (จะ)
              <p class="text-xs text-gray-500">ใช้กับการตัดสินใจทันที หรือคาดเดา</p>
              <p class="text-sm">"I <strong>will</strong> call you later."</p>
            </div>
            <div class="p-3 bg-white border-l-4 border-purple-400 rounded shadow-sm">
              <strong class="text-purple-600">Going to</strong> (กำลังจะ)
              <p class="text-xs text-gray-500">ใช้กับแผนที่วางไว้แล้วแน่นอน</p>
              <p class="text-sm">"I am <strong>going to</strong> visit Japan."</p>
            </div>
          </div>
        `,
        quiz: {
          question: "ถ้าตัดสินใจเดี๋ยวนั้นว่าจะทำอะไร ควรใช้คำไหน?",
          options: ["Will", "Going to", "Shall", "Must"],
          correctAnswer: 0
        }
      },
      { 
        title: "Continuous Tense", 
        desc: "กำลังทำ... (is/am/are + ing)", 
        content: `
          <p class="mb-2">เน้นเหตุการณ์ที่<strong>กำลังเกิดขึ้นตอนนี้</strong></p>
          <div class="bg-gray-800 text-white p-3 rounded font-mono text-sm text-center">
            Subject + is/am/are + V-ing
          </div>
          <ul class="mt-3 space-y-1 text-sm">
            <li>✅ I <strong>am eating</strong>. (ฉันกำลังกิน)</li>
            <li>✅ She <strong>is sleeping</strong>. (เธอกำลังหลับ)</li>
            <li>✅ They <strong>are playing</strong>. (พวกเขากำลังเล่น)</li>
          </ul>
        `,
        quiz: {
          question: "She ... sleeping.",
          options: ["am", "are", "is", "be"],
          correctAnswer: 2
        }
      },
      { 
        title: "Modal Verbs", 
        desc: "Can, Should, Must", 
        content: `
          <p>กริยาช่วยที่บอกความหมายพิเศษ:</p>
          <ul class="mt-2 space-y-2">
            <li class="flex items-center gap-2">
              <span class="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold text-sm">Can</span>
              <span>สามารถ/ทำได้</span>
              <span class="text-gray-400 text-xs">I can swim.</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold text-sm">Should</span>
              <span>ควรจะ (แนะนำ)</span>
              <span class="text-gray-400 text-xs">You should sleep.</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold text-sm">Must</span>
              <span>ต้อง (บังคับ)</span>
              <span class="text-gray-400 text-xs">I must go.</span>
            </li>
          </ul>
        `,
        quiz: {
          question: "ถ้าจะแนะนำเพื่อนว่า 'ควรจะ' นอนพักผ่อน ใช้คำไหน?",
          options: ["Can", "Must", "Should", "Will"],
          correctAnswer: 2
        }
      }
    ]
  },
  {
    id: 5,
    title: "Stage 5: Conversation",
    subtitle: "สนทนาจริง 81-100%",
    description: "นำทุกสิ่งที่เรียนมาใช้ในสถานการณ์จริง",
    icon: <Globe size={28} className="text-white" />,
    color: "from-rose-400 to-rose-500",
    topics: [
      { 
        title: "Restaurant & Shopping", 
        desc: "สั่งอาหารและซื้อของ", 
        content: `
          <div class="space-y-3">
            <div class="border-b pb-2">
              <h4 class="font-bold text-rose-500 mb-1">🍽️ Restaurant</h4>
              <p class="text-sm">"Can I have the menu, please?" (ขอเมนูหน่อย)</p>
              <p class="text-sm">"I would like..." (ฉันอยากได้...)</p>
              <p class="text-sm">"Check bill, please." (เก็บเงินด้วย)</p>
            </div>
            <div>
              <h4 class="font-bold text-rose-500 mb-1">🛍️ Shopping</h4>
              <p class="text-sm">"How much is this?" (อันนี้ราคาเท่าไหร่)</p>
              <p class="text-sm">"Can I try it on?" (ขอลองใส่ได้ไหม)</p>
            </div>
          </div>
        `,
        quiz: {
          question: "'Check bill, please' แปลว่าอะไร?",
          options: ["ขอดูเมนู", "ขอใบเสร็จ", "เก็บเงินด้วย", "อาหารไม่อร่อย"],
          correctAnswer: 2
        }
      },
      { 
        title: "Travel English", 
        desc: "ภาษาอังกฤษเพื่อการท่องเที่ยว", 
        content: `
          <ul class="space-y-2 bg-rose-50 p-3 rounded border border-rose-100">
            <li>✈️ <strong>Airport:</strong> "Where is the check-in counter?"</li>
            <li>🚕 <strong>Taxi:</strong> "Please take me to this hotel."</li>
            <li>🏨 <strong>Hotel:</strong> "I have a reservation." (ฉันจองไว้แล้ว)</li>
            <li>🚽 <strong>Emergency:</strong> "Where is the toilet?"</li>
          </ul>
        `,
        quiz: {
          question: "ประโยค 'I have a reservation' ใช้เมื่อไหร่?",
          options: ["เมื่อหลงทาง", "เมื่อจองโรงแรมไว้แล้ว", "เมื่อหิวข้าว", "เมื่อเรียกรถแท็กซี่"],
          correctAnswer: 1
        }
      },
      { 
        title: "Job Interview", 
        desc: "การสัมภาษณ์งานเบื้องต้น", 
        content: `
          <p class="mb-2 font-semibold">คำถามยอดฮิต:</p>
          <div class="space-y-3 text-sm">
            <div class="bg-white p-2 rounded shadow-sm">
              <p class="font-bold">Q: Tell me about yourself.</p>
              <p class="text-gray-600">A: I am... I have experience in...</p>
            </div>
            <div class="bg-white p-2 rounded shadow-sm">
              <p class="font-bold">Q: What are your strengths?</p>
              <p class="text-gray-600">A: I am hardworking and a fast learner.</p>
            </div>
          </div>
        `,
        quiz: {
          question: "Strengths หมายถึงอะไรในการสัมภาษณ์งาน?",
          options: ["จุดอ่อน", "จุดแข็ง/ข้อดี", "งานอดิเรก", "ประวัติการศึกษา"],
          correctAnswer: 1
        }
      },
      { 
        title: "Slang & Idioms", 
        desc: "พูดให้เหมือนเจ้าของภาษา", 
        content: `
          <div class="grid grid-cols-2 gap-2 text-center text-sm">
            <div class="bg-gray-100 p-2 rounded">
              <strong>Piece of cake</strong>
              <br><span class="text-gray-500">ง่ายมากๆ (กล้วยๆ)</span>
            </div>
            <div class="bg-gray-100 p-2 rounded">
              <strong>Broke</strong>
              <br><span class="text-gray-500">ถังแตก (ไม่มีเงิน)</span>
            </div>
            <div class="bg-gray-100 p-2 rounded">
              <strong>Chill out</strong>
              <br><span class="text-gray-500">ผ่อนคลาย</span>
            </div>
            <div class="bg-gray-100 p-2 rounded">
              <strong>Hang out</strong>
              <br><span class="text-gray-500">ออกไปเที่ยวเล่น</span>
            </div>
          </div>
        `,
        quiz: {
          question: "ถ้าจะบอกว่า 'เรื่องนี้ง่ายมากๆ' ควรใช้สำนวนไหน?",
          options: ["Hang out", "Broke", "Piece of cake", "Chill out"],
          correctAnswer: 2
        }
      }
    ]
  }
];

// --- Internal Component: Lesson Modal with Quiz Logic ---
const LessonModal = ({ topic, onClose, onComplete, isCompleted, onStartAI }: { 
  topic: Topic; 
  onClose: () => void; 
  onComplete: (title: string) => void; 
  isCompleted: boolean;
  onStartAI: (topic: Topic) => void;
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);

  const handleQuizSubmit = () => {
    if (selectedOption === null) return;
    setShowResult(true);
  };

  const isCorrect = selectedOption === topic.quiz.correctAnswer;

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden modal-animate flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-xl text-gray-800">{topic.title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Lesson Content */}
          <div 
            className="text-gray-700 leading-relaxed mb-8"
            dangerouslySetInnerHTML={{ __html: topic.content }}
          ></div>

          {/* Mini Quiz Section */}
          <div className="bg-teal-50 p-5 rounded-xl border border-teal-100">
            <div className="flex items-center gap-2 mb-3 text-teal-800 font-bold">
              <Trophy size={20} />
              <h4>แบบทดสอบความเข้าใจ (Mini Quiz)</h4>
            </div>
            <p className="text-sm mb-4 font-medium">{topic.quiz.question}</p>
            <div className="space-y-2">
              {topic.quiz.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showResult && setSelectedOption(index)}
                  disabled={showResult}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-all duration-200
                    ${showResult 
                      ? index === topic.quiz.correctAnswer 
                        ? 'bg-green-100 border-green-500 text-green-800' // Correct answer shown
                        : index === selectedOption 
                          ? 'bg-red-100 border-red-500 text-red-800' // Wrong answer selected
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      : selectedOption === index
                        ? 'bg-teal-100 border-teal-500 text-teal-900 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                    }
                  `}
                >
                  {option}
                  {showResult && index === topic.quiz.correctAnswer && <span className="float-right text-green-600 font-bold">✓</span>}
                  {showResult && index === selectedOption && index !== topic.quiz.correctAnswer && <span className="float-right text-red-600 font-bold">✗</span>}
                </button>
              ))}
            </div>
            
            {!showResult ? (
              <button 
                onClick={handleQuizSubmit}
                disabled={selectedOption === null}
                className="mt-4 w-full py-2 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ตรวจคำตอบ
              </button>
            ) : (
              <div className={`mt-4 p-3 rounded-lg text-center text-sm font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isCorrect ? 'เก่งมาก! ถูกต้องครับ 🎉' : 'ยังไม่ถูก ลองใหม่ครั้งหน้านะครับ ✌️'}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t bg-gray-50 flex flex-col sm:flex-row justify-between gap-3 items-center">
            <button 
                onClick={() => {
                    onClose();
                    onStartAI(topic);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-bold shadow-md hover:from-purple-600 hover:to-indigo-600 transition flex items-center justify-center gap-2"
            >
                <Sparkles size={18} />
                Practice with AI
            </button>

            <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition"
                >
                    ปิด
                </button>
                {/* ปุ่ม Mark as Done จะกดได้ก็ต่อเมื่อตอบถูกแล้ว (หรือเรียนซ้ำ) */}
                <button 
                    onClick={() => onComplete(topic.title)}
                    disabled={!isCompleted && (!showResult || !isCorrect)} 
                    className={`px-6 py-2 rounded-lg font-bold shadow-md transition flex items-center gap-2 ${
                    isCompleted
                    ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    : (!showResult || !isCorrect)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                    }`}
                >
                    {isCompleted ? 'เรียนซ้ำ' : (
                      <>
                        <CheckCircle size={18} />
                        เข้าใจแล้ว!
                      </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  // --- Persistent State using localStorage ---
  const [completedTopics, setCompletedTopics] = useState<string[]>(() => {
    // 1. ลองดึงข้อมูลจาก LocalStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('english-hero-progress');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse progress", e);
        }
      }
    }
    return []; // ถ้าไม่มี ให้เริ่มใหม่
  });

  // 2. บันทึกลง LocalStorage ทุกครั้งที่ completedTopics เปลี่ยน
  useEffect(() => {
    localStorage.setItem('english-hero-progress', JSON.stringify(completedTopics));
  }, [completedTopics]);
  
  // --- Chat State ---
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'สวัสดีครับ! ผมคือ AI Tutor ของคุณ ✨ มีอะไรให้ช่วยเรื่องภาษาอังกฤษไหมครับ? (Hi! I am your AI Tutor. How can I help?)' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleComplete = (topicTitle: string) => {
    if (completedTopics.includes(topicTitle)) {
      setCompletedTopics(completedTopics.filter(t => t !== topicTitle));
    } else {
      setCompletedTopics([...completedTopics, topicTitle]);
      // ปิด Modal อัตโนมัติเมื่อเรียนจบ (ถ้าต้องการ)
      // setSelectedTopic(null); 
    }
  };

  const totalTopics = curriculumData.reduce((acc, stage) => acc + stage.topics.length, 0);
  const progress = Math.round((completedTopics.length / totalTopics) * 100);

  // --- Chat Logic ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, chatOpen]);

  const callGemini = async (prompt: string, customHistory: ChatMessage[] | null = null) => {
    setIsAiLoading(true);
    
    // Prepare history for API
    const history = (customHistory || chatMessages).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    // System instruction: Tutor Persona
    const systemInstruction = {
        parts: [{ text: "You are a friendly and encouraging English tutor for a Thai beginner student. Explain things simply. If the user speaks Thai, reply in Thai with clear English examples. If they try English, correct them gently and encourage them. Use emojis to be friendly." }]
    };

    try {
      const response = await fetchWithBackoff(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        const reply = data.candidates[0].content.parts[0].text;
        setChatMessages(prev => [...prev, { role: 'model', text: reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'model', text: 'ขออภัยครับ ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งนะครับ (Sorry, I encountered an error.)' }]);
      }
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ (Connection error.)' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    callGemini(userText);
  };

  const startPracticeWithAI = (topic: Topic) => {
    setChatOpen(true);
    const startPrompt = `The user is currently learning the topic: "${topic.title}". \nDescription: ${topic.desc}. \nPlease act as a teacher and start a simple practice session or roleplay related to this topic. Ask the user a simple question to start.`;
    
    // Add a system message to UI to show context change
    setChatMessages(prev => [
        ...prev, 
        { role: 'model', text: `✨ เยี่ยมเลย! เรามาฝึกเรื่อง "${topic.title}" กันครับ เดี๋ยวผมจะเริ่มถามคำถามง่ายๆ นะครับ... (Let's practice!)` }
    ]);
    
    // Call AI silently to get the first question
    callGemini(startPrompt, []); 
  };

  return (
    <div className="min-h-screen pb-12 relative">
      <GlobalStyles />
      
      {/* Header */}
      <header className="gradient-header text-white px-6 py-5 sticky top-0 z-10 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-none">English Zero to Hero</h1>
            <p className="text-sm text-teal-100 opacity-90 font-light mt-1">เส้นทางสู่ความเก่งภาษาอังกฤษ 0-100</p>
          </div>
        </div>
        <div className="hidden md:block bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
          <span className="font-bold">{completedTopics.length}</span> / {totalTopics} บทเรียนสำเร็จ
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white shadow-sm sticky top-[80px] z-10">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-4">
          <span className="text-xs font-bold text-gray-500 uppercase">Progress</span>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-400 transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-sm font-bold text-teal-600">{progress}%</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        
        {curriculumData.map((stage) => (
          <section key={stage.id} className="relative">
            {/* Stage Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stage.color} shadow-lg shrink-0`}>
                {stage.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {stage.title}
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full border border-gray-200 font-normal">
                    {stage.subtitle}
                  </span>
                </h2>
                <p className="text-gray-500 mt-1">{stage.description}</p>
              </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-4">
              {stage.topics.map((topic, index) => {
                const isDone = completedTopics.includes(topic.title);
                return (
                  <div 
                    key={index}
                    onClick={() => setSelectedTopic(topic)}
                    className={`
                      relative bg-white p-5 rounded-xl border border-gray-100 shadow-sm cursor-pointer group
                      transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-teal-300
                      ${isDone ? 'border-teal-200 bg-teal-50/30' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-lg ${isDone ? 'text-teal-700' : 'text-gray-800'}`}>
                        {topic.title}
                      </h3>
                      {isDone && <CheckCircle size={20} className="text-teal-500" />}
                    </div>
                    <p className="text-gray-500 text-sm mb-4">{topic.desc}</p>
                    <div className="flex items-center text-teal-500 text-sm font-medium group-hover:translate-x-1 transition-transform">
                      {isDone ? 'ทบทวน' : 'เริ่มเรียน'} <ChevronRight size={16} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        &copy; 2025 English Zero to Hero. Designed for you.
      </footer>

      {/* --- AI Chat Widget --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window */}
        {chatOpen && (
            <div className="bg-white w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden modal-animate">
                {/* Chat Header */}
                <div className="bg-teal-500 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} />
                        <span className="font-bold">AI English Tutor</span>
                    </div>
                    <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-2 shrink-0">
                                    <Bot size={16} className="text-teal-600"/>
                                </div>
                             )}
                            <div className={`max-w-[80%] p-3 text-sm ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isAiLoading && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-2 shrink-0">
                                <Bot size={16} className="text-teal-600"/>
                            </div>
                            <div className="bg-gray-200 p-3 rounded-xl flex gap-1 items-center">
                                <div className="w-2 h-2 bg-gray-500 rounded-full typing-dot"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full typing-dot"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full typing-dot"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 bg-white border-t flex gap-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="พิมพ์ข้อความ... (Type a message)"
                        className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-teal-500 bg-gray-50"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isAiLoading}
                        className="bg-teal-500 text-white p-2 rounded-full hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        )}

        {/* Floating Button */}
        {!chatOpen && (
            <button 
                onClick={() => setChatOpen(true)}
                className="bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 transition hover:scale-110 flex items-center gap-2 group"
            >
                <Sparkles size={24} />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium">
                    Ask AI Tutor
                </span>
            </button>
        )}
      </div>

      {/* Lesson Modal (Now with Quiz) */}
      {selectedTopic && (
        <LessonModal 
          topic={selectedTopic} 
          onClose={() => setSelectedTopic(null)} 
          onComplete={toggleComplete}
          isCompleted={completedTopics.includes(selectedTopic.title)}
          onStartAI={startPracticeWithAI}
        />
      )}
    </div>
  );
}