// --- 1. Yapılandırma ve Değişkenler ---
let userAge = null;
let userGender = null;
let rawScore = 0;
let currentQuestionIndex = 0;
let timerInterval = null;
let timeLeft = 30;

// Örnek soru havuzu. Farklı zorluk seviyelerinde ve kategorilerde sorular eklenebilir.
const questions = [
    {
        id: 1,
        category: "Mantıksal",
        text: "2, 6, 12, 20, 30, ? Dizideki soru işaretli yere hangi sayı gelmelidir?",
        options: ["38", "40", "42", "48"],
        correct: 2, // "42" -> index 2
        difficulty: 1
    },
    {
        id: 2,
        category: "Sözel",
        text: "Doktor : Hasta → Avukat : ? İlişkisini en iyi tamamlayan nedir?",
        options: ["Hakim", "Mahkeme", "Müvekkil", "Suçlu"],
        correct: 2, // "Müvekkil"
        difficulty: 1
    },
    {
        id: 3,
        category: "Görsel-Uzamsal",
        text: "Bir küpte Kırmızı↔Mavi, Yeşil↔Beyaz, Sarı↔Siyah eşleşmeleri var. Üst yüz Kırmızı, ön yüz Yeşil ise sağ yüz hangi renktir?",
        options: ["Beyaz", "Sarı", "Mavi", "Siyah"],
        correct: 0, // Küp standartlarına göre Beyaz
        difficulty: 2
    },
    {
        id: 4,
        category: "Mantıksal",
        text: "Bazı güller kırmızıdır. Bütün kırmızılar çiçektir. Hiçbir çiçek yapay değildir. Hangisi KESİNLİKLE doğrudur?",
        options: [
            "Bazı güller yapay değildir.", // Doğru
            "Bütün kırmızılar güldür.",
            "Hiçbir gül çiçek değildir.",
            "Bütün çiçekler güldür."
        ],
        correct: 0,
        difficulty: 1
    },
    {
        id: 5,
        category: "Kodlama",
        text: "ABC → 123 ise XYZ → ? (İpucu: İngilizce alfabe sırası)",
        options: ["222324", "242526", "232425", "252627"],
        correct: 1, // 242526
        difficulty: 2
    }
];

// --- 2. Norm Tabloları (Yaş Grupları ve Cinsiyete Göre Ham Puan -> IQ Dönüşümü) ---
// Bu tablo TAMAMEN TEMSİLİDİR. Gerçek bir test için klinik araştırmalarla
// oluşturulmuş norm tabloları kullanılmalıdır.
const normTables = {
    "16-24": {
        male: [0, 70, 80, 90, 105, 120], // 0-5 ham puan için IQ karşılıkları
        female: [0, 75, 85, 95, 110, 125]
    },
    "25-34": {
        male: [0, 75, 85, 95, 110, 125],
        female: [0, 80, 90, 100, 115, 130]
    },
    "35-44": {
        male: [0, 80, 90, 100, 115, 130],
        female: [0, 85, 95, 105, 120, 135]
    },
    "45-90": {
        male: [0, 85, 95, 105, 120, 130],
        female: [0, 90, 100, 110, 125, 135]
    }
};

// IQ aralıklarına göre etiketler
function getIQLabel(iq) {
    if (iq >= 130) return "Üstün Zeka";
    if (iq >= 115) return "Yüksek Ortalama Üstü";
    if (iq >= 100) return "Ortalama";
    if (iq >= 85) return "Normal Altı";
    return "Düşük";
}

// Kullanıcının yaş grubunu belirle
function getAgeGroup(age) {
    if (age >= 16 && age <= 24) return "16-24";
    if (age >= 25 && age <= 34) return "25-34";
    if (age >= 35 && age <= 44) return "35-44";
    if (age >= 45) return "45-90";
    return null;
}

// --- 3. Test Akışı ve Zamanlayıcı ---

function startTest() {
    const ageInput = document.getElementById('age').value;
    const genderSelect = document.getElementById('gender').value;
    const errorMsg = document.getElementById('error-msg');

    if (!ageInput || !genderSelect) {
        errorMsg.textContent = "Lütfen yaşınızı girin ve cinsiyetinizi seçin.";
        return;
    }
    userAge = parseInt(ageInput);
    userGender = genderSelect;

    if (userAge < 16 || userAge > 90) {
        errorMsg.textContent = "Test 16-90 yaş arası içindir.";
        return;
    }

    // Ekranları değiştir
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    document.getElementById('total-questions').textContent = questions.length;
    
    rawScore = 0;
    currentQuestionIndex = 0;
    loadQuestion();
}

function loadQuestion() {
    // Önceki zamanlayıcıyı temizle
    clearInterval(timerInterval);
    
    const question = questions[currentQuestionIndex];
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('question-text').textContent = question.text;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => selectOption(index, button);
        optionsContainer.appendChild(button);
    });

    document.getElementById('next-btn').disabled = true;
    
    // Zamanlayıcıyı başlat
    timeLeft = 30;
    document.getElementById('time-left').textContent = timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            nextQuestion(); // Süre bitince otomatik geç
        }
    }, 1000);
}

let selectedOptionIndex = null;

function selectOption(index, buttonElement) {
    // Tüm seçeneklerin seçimini kaldır
    const allOptions = document.querySelectorAll('.option-btn');
    allOptions.forEach(btn => btn.classList.remove('selected'));
    
    // Tıklananı seç
    buttonElement.classList.add('selected');
    selectedOptionIndex = index;
    document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
    clearInterval(timerInterval);
    
    // Cevabı kontrol et
    const question = questions[currentQuestionIndex];
    if (selectedOptionIndex !== null && selectedOptionIndex === question.correct) {
        rawScore++;
    }
    
    // Sonraki soruya geç veya testi bitir
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        selectedOptionIndex = null;
        loadQuestion();
    } else {
        showResult();
    }
}

// --- 4. Sonuç ve Norma Göre IQ Hesaplama ---
function showResult() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    const ageGroup = getAgeGroup(userAge);
    const gender = userGender;
    
    // Norm tablosundan ham puana karşılık gelen IQ'yu bul
    const normArray = normTables[ageGroup][gender];
    // Ham puanın 0-5 arasında olacağını varsayıyoruz, taşma durumlarına dikkat!
    const clampedScore = Math.min(rawScore, normArray.length - 1);
    const iqScore = normArray[clampedScore];
    
    document.getElementById('raw-score').textContent = rawScore;
    document.getElementById('age-group').textContent = `${ageGroup} (${gender === 'male' ? 'Erkek' : 'Kadın'})`;
    document.getElementById('iq-score').textContent = iqScore;
    document.getElementById('iq-label').textContent = getIQLabel(iqScore);
}