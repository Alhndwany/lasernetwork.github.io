// ملف simulation.js - محاكاة تفاعلية لانتقال البيانات بالليزر
class LaserTransmissionSimulation {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // عناصر التحكم
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.demoBtn = document.getElementById('demo-btn');
        this.speedSlider = document.getElementById('speed-slider');
        
        // عناصر العرض
        this.statusIndicator = document.getElementById('status-indicator');
        this.originalMessage = document.getElementById('original-message');
        this.binaryData = document.getElementById('binary-data');
        this.receivedMessage = document.getElementById('received-message');
        this.bitsCount = document.getElementById('bits-count');
        this.transmissionTime = document.getElementById('transmission-time');
        this.connectionStatus = document.getElementById('connection-status');
        
        // حالة المحاكاة
        this.isRunning = false;
        this.currentStage = 0; // 0: idle, 1: encoding, 2: moving up, 3: laser, 4: moving down, 5: decoding
        this.simulationSpeed = 5;
        this.startTime = 0;
        this.binaryString = '';
        this.currentBitIndex = 0;
        
        // إعدادات الرسومات
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.towerWidth = 30;
        this.towerHeight = 200;
        this.tower1X = 0;
        this.tower2X = 0;
        this.towerY = 0;
        this.personSize = 30;
        
        // متحركات
        this.bitPositions = [];
        this.laserProgress = 0;
        this.animationId = null;
        
        // إعداد الألوان
        this.colors = {
            background: '#000000',
            tower: '#1a1a1a',
            towerHighlight: '#262626',
            person: '#333333',
            personActive: '#444444',
            laser: '#ef4444',
            laserGlow: 'rgba(239, 68, 68, 0.7)',
            bit0: '#3b82f6', // أزرق للبت 0
            bit1: '#ef4444', // أحمر للبت 1
            text: '#ffffff',
            status: {
                idle: '#6b7280',
                encoding: '#f59e0b',
                transmitting: '#ef4444',
                decoding: '#10b981',
                complete: '#10b981'
            }
        };
        
        // تهيئة المحاكاة
        this.init();
    }
    
    init() {
        // ضبط حجم Canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // إعداد المستمعين للأحداث
        this.sendBtn.addEventListener('click', () => this.startSimulation());
        this.resetBtn.addEventListener('click', () => this.resetSimulation());
        this.demoBtn.addEventListener('click', () => this.runDemo());
        this.speedSlider.addEventListener('input', (e) => {
            this.simulationSpeed = parseInt(e.target.value);
        });
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startSimulation();
            }
        });
        
        // البدء في رسم المحاكاة
        this.draw();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvasWidth = container.clientWidth;
        this.canvasHeight = 384; // 96 * 4 (h-96 في Tailwind)
        
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        // حساب مواقع البرجين
        this.tower1X = this.canvasWidth * 0.25;
        this.tower2X = this.canvasWidth * 0.75;
        this.towerY = this.canvasHeight * 0.7;
        
        this.draw();
    }
    
    draw() {
        // مسح Canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // رسم خلفية النجوم
        this.drawStars();
        
        // رسم الأرض
        this.drawGround();
        
        // رسم البرجين
        this.drawTower(this.tower1X, this.towerY, 'البرج المرسل');
        this.drawTower(this.tower2X, this.towerY, 'البرج المستقبل');
        
        // رسم الأشخاص
        this.drawPerson(this.tower1X, this.towerY + this.towerHeight / 2 + 20, 'أحمد', this.currentStage >= 1);
        this.drawPerson(this.tower2X, this.towerY + this.towerHeight / 2 + 20, 'سارة', this.currentStage >= 5);
        
        // رسم اللابتوبات
        this.drawLaptop(this.tower1X, this.towerY + this.towerHeight / 2 + 60, true);
        this.drawLaptop(this.tower2X, this.towerY + this.towerHeight / 2 + 60, false);
        
        // رسم البيانات المتحركة
        this.drawMovingBits();
        
        // رسم شعاع الليزر
        if (this.currentStage === 3) {
            this.drawLaserBeam();
        }
        
        // إذا كانت المحاكاة جارية، استمر في الرسم
        if (this.isRunning || this.currentStage > 0) {
            this.animationId = requestAnimationFrame(() => this.draw());
        }
    }
    
    drawStars() {
        // رسم نجوم عشوائية في الخلفية
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvasWidth;
            const y = Math.random() * (this.canvasHeight * 0.6);
            const size = Math.random() * 1.5;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawGround() {
        // رسم الأرض
        const groundHeight = this.canvasHeight * 0.3;
        const groundY = this.canvasHeight - groundHeight;
        
        // تدرج لوني للأرض
        const gradient = this.ctx.createLinearGradient(0, groundY, 0, this.canvasHeight);
        gradient.addColorStop(0, '#111111');
        gradient.addColorStop(1, '#000000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, groundY, this.canvasWidth, groundHeight);
        
        // رسم عشب صغير
        this.ctx.fillStyle = '#1a472a';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.canvasWidth;
            const height = 5 + Math.random() * 10;
            this.ctx.fillRect(x, groundY, 2, -height);
        }
    }
    
    drawTower(x, y, label) {
        const towerTopY = y - this.towerHeight;
        
        // جسم البرج
        const gradient = this.ctx.createLinearGradient(x - this.towerWidth / 2, towerTopY, x - this.towerWidth / 2, y);
        gradient.addColorStop(0, this.colors.towerHighlight);
        gradient.addColorStop(1, this.colors.tower);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - this.towerWidth / 2, towerTopY, this.towerWidth, this.towerHeight);
        
        // إبراز الحواف
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - this.towerWidth / 2, towerTopY, this.towerWidth, this.towerHeight);
        
        // قمة البرج
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(x - this.towerWidth / 2 - 5, towerTopY - 10, this.towerWidth + 10, 10);
        
        // مصباح الليزر
        this.ctx.fillStyle = this.currentStage === 3 ? '#ef4444' : '#666666';
        this.ctx.beginPath();
        this.ctx.arc(x, towerTopY - 5, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // تأثير توهج إذا كان نشطاً
        if (this.currentStage === 3) {
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(x, towerTopY - 5, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
        
        // تسمية البرج
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, x, y + 20);
    }
    
    drawPerson(x, y, name, isActive) {
        // جسم الشخص
        this.ctx.fillStyle = isActive ? this.colors.personActive : this.colors.person;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.personSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // تفاصيل الوجه
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x - 5, y - 3, 2, 0, Math.PI * 2); // عين يسرى
        this.ctx.arc(x + 5, y - 3, 2, 0, Math.PI * 2); // عين يمينية
        this.ctx.fill();
        
        // فم
        this.ctx.beginPath();
        this.ctx.arc(x, y + 5, 3, 0, Math.PI, false); // ابتسامة
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // اسم الشخص
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(name, x, y + this.personSize / 2 + 15);
    }
    
    drawLaptop(x, y, isSender) {
        // جسم اللابتوب
        this.ctx.fillStyle = '#222222';
        this.ctx.fillRect(x - 25, y - 10, 50, 30);
        
        // شاشة اللابتوب
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x - 20, y - 5, 40, 20);
        
        // نص على الشاشة
        this.ctx.fillStyle = isSender ? '#3b82f6' : '#10b981';
        this.ctx.font = '8px Arial';
        this.ctx.textAlign = 'center';
        
        if (isSender) {
            if (this.currentStage === 0) {
                this.ctx.fillText('جاهز...', x, y + 5);
            } else if (this.currentStage === 1) {
                this.ctx.fillText('ترميز...', x, y + 5);
            }
        } else {
            if (this.currentStage < 5) {
                this.ctx.fillText('في الانتظار...', x, y + 5);
            } else if (this.currentStage === 5) {
                this.ctx.fillText('فك الترميز...', x, y + 5);
            } else if (this.currentStage === 6) {
                const message = this.receivedMessage.textContent;
                if (message.length > 10) {
                    this.ctx.fillText(message.substring(0, 10) + '...', x, y + 5);
                } else {
                    this.ctx.fillText(message, x, y + 5);
                }
            }
        }
        
        // لوحة المفاتيح
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x - 25, y + 20, 50, 5);
    }
    
    drawMovingBits() {
        if (this.bitPositions.length === 0) return;
        
        for (const bit of this.bitPositions) {
            // رسم البت
            this.ctx.fillStyle = bit.value === '0' ? this.colors.bit0 : this.colors.bit1;
            this.ctx.beginPath();
            this.ctx.arc(bit.x, bit.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // تأثير توهج
            this.ctx.shadowColor = bit.value === '0' ? this.colors.bit0 : this.colors.bit1;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(bit.x, bit.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // قيمة البت
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(bit.value, bit.x, bit.y);
        }
    }
    
    drawLaserBeam() {
        const tower1TopY = this.towerY - this.towerHeight;
        const tower2TopY = this.towerY - this.towerHeight;
        
        // حساب نقطة نهاية الليزر بناءً على التقدم
        const endX = this.tower1X + (this.tower2X - this.tower1X) * this.laserProgress;
        const endY = tower1TopY;
        
        // رسم شعاع الليزر
        this.ctx.strokeStyle = this.colors.laser;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        // تأثير توهج
        this.ctx.shadowColor = this.colors.laser;
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.tower1X, tower1TopY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        
        // رسم جسيمات على طول شعاع الليزر
        for (let i = 0; i < 10; i++) {
            const particleX = this.tower1X + (endX - this.tower1X) * Math.random();
            const particleY = tower1TopY + (Math.random() - 0.5) * 10;
            const size = 2 + Math.random() * 3;
            
            this.ctx.fillStyle = this.colors.laser;
            this.ctx.beginPath();
            this.ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // رسم نقطة التأثير
        if (this.laserProgress > 0) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(endX, endY, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.arc(endX, endY, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
    
    startSimulation() {
        if (this.isRunning) return;
        
        const message = this.messageInput.value.trim();
        if (!message) {
            alert('الرجاء إدخال رسالة لإرسالها');
            return;
        }
        
        this.isRunning = true;
        this.currentStage = 1;
        this.startTime = Date.now();
        this.binaryString = this.textToBinary(message);
        this.bitPositions = [];
        this.currentBitIndex = 0;
        this.laserProgress = 0;
        
        // تحديث واجهة المستخدم
        this.originalMessage.textContent = message;
        this.binaryData.textContent = this.formatBinary(this.binaryString);
        this.bitsCount.textContent = this.binaryString.length;
        this.receivedMessage.textContent = '-';
        this.connectionStatus.textContent = 'جاري الاتصال...';
        this.connectionStatus.parentElement.querySelector('.bg-green-500').className = 'w-3 h-3 rounded-full bg-yellow-500 animate-pulse';
        
        // بدء المحاكاة
        this.updateStatus('جاري ترميز البيانات...', 'encoding');
        this.draw();
        
        // بدء تسلسل المحاكاة
        this.runSimulationSequence();
    }
    
    runSimulationSequence() {
        if (!this.isRunning) return;
        
        switch (this.currentStage) {
            case 1: // الترميز
                this.simulateEncoding();
                break;
            case 2: // الصعود
                this.simulateMovingUp();
                break;
            case 3: // إرسال الليزر
                this.simulateLaserTransmission();
                break;
            case 4: // النزول
                this.simulateMovingDown();
                break;
            case 5: // فك الترميز
                this.simulateDecoding();
                break;
            case 6: // الانتهاء
                this.completeSimulation();
                break;
        }
    }
    
    simulateEncoding() {
        // محاكاة عملية الترميز
        setTimeout(() => {
            this.updateStatus('جاري إرسال البيانات لأعلى البرج...', 'transmitting');
            this.currentStage = 2;
            this.runSimulationSequence();
        }, 1500 / this.simulationSpeed);
    }
    
    simulateMovingUp() {
        // إنشاء بتات متحركة
        const bits = this.binaryString.split('');
        const startX = this.tower1X;
        const startY = this.towerY + this.towerHeight / 2 + 60; // من اللابتوب
        const endY = this.towerY - this.towerHeight; // إلى قمة البرج
        
        let bitsCreated = 0;
        const createBitInterval = setInterval(() => {
            if (bitsCreated < bits.length) {
                this.bitPositions.push({
                    x: startX,
                    y: startY,
                    targetY: endY,
                    value: bits[bitsCreated],
                    speed: 2 + Math.random() * 2,
                    stage: 'up'
                });
                bitsCreated++;
            } else {
                clearInterval(createBitInterval);
                
                // الانتقال للمرحلة التالية بعد وقت كاف
                setTimeout(() => {
                    this.updateStatus('جاري الإرسال عبر شعاع الليزر...', 'transmitting');
                    this.currentStage = 3;
                    this.runSimulationSequence();
                }, 1000 / this.simulationSpeed);
            }
        }, 200 / this.simulationSpeed);
        
        // تحريك البتات لأعلى
        const moveBits = () => {
            let allBitsArrived = true;
            
            for (const bit of this.bitPositions) {
                if (bit.stage === 'up') {
                    if (bit.y > bit.targetY) {
                        bit.y -= bit.speed;
                        allBitsArrived = false;
                    } else {
                        bit.y = bit.targetY;
                    }
                }
            }
            
            if (!allBitsArrived) {
                requestAnimationFrame(moveBits);
            }
        };
        
        moveBits();
    }
    
    simulateLaserTransmission() {
        // محاكاة انتقال الليزر
        const laserDuration = 2000 / this.simulationSpeed;
        const startTime = Date.now();
        
        const animateLaser = () => {
            const elapsed = Date.now() - startTime;
            this.laserProgress = Math.min(elapsed / laserDuration, 1);
            
            if (this.laserProgress < 1) {
                requestAnimationFrame(animateLaser);
            } else {
                // نقل البتات إلى البرج المستقبل
                for (const bit of this.bitPositions) {
                    bit.x = this.tower2X;
                    bit.stage = 'down';
                    bit.targetY = this.towerY + this.towerHeight / 2 + 60; // إلى اللابتوب المستقبل
                }
                
                this.updateStatus('جاري استقبال البيانات في البرج المستقبل...', 'transmitting');
                this.currentStage = 4;
                this.runSimulationSequence();
            }
        };
        
        animateLaser();
    }
    
    simulateMovingDown() {
        // تحريك البتات لأسفل في البرج المستقبل
        const moveBitsDown = () => {
            let allBitsArrived = true;
            
            for (const bit of this.bitPositions) {
                if (bit.stage === 'down') {
                    if (bit.y < bit.targetY) {
                        bit.y += 3;
                        allBitsArrived = false;
                    } else {
                        bit.y = bit.targetY;
                    }
                }
            }
            
            if (!allBitsArrived) {
                requestAnimationFrame(moveBitsDown);
            } else {
                // الانتقال لمرحلة فك الترميز
                setTimeout(() => {
                    this.updateStatus('جاري فك ترميز البيانات...', 'decoding');
                    this.currentStage = 5;
                    this.runSimulationSequence();
                }, 500 / this.simulationSpeed);
            }
        };
        
        moveBitsDown();
    }
    
    simulateDecoding() {
        // محاكاة عملية فك الترميز
        setTimeout(() => {
            const message = this.binaryToText(this.binaryString);
            this.receivedMessage.textContent = message;
            
            this.updateStatus('جاري إتمام العملية...', 'decoding');
            this.currentStage = 6;
            this.runSimulationSequence();
        }, 1500 / this.simulationSpeed);
    }
    
    completeSimulation() {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        this.transmissionTime.textContent = `${duration}ms`;
        this.updateStatus('تم إرسال البيانات بنجاح!', 'complete');
        this.connectionStatus.textContent = 'متصل';
        this.connectionStatus.parentElement.querySelector('.bg-yellow-500').className = 'w-3 h-3 rounded-full bg-green-500 animate-pulse';
        
        this.isRunning = false;
        
        // إظهار تأثير النجاح
        this.showSuccessEffect();
    }
    
    showSuccessEffect() {
        // رسم تأثير نجاح حول اللابتوب المستقبل
        let radius = 5;
        const maxRadius = 30;
        const laptopX = this.tower2X;
        const laptopY = this.towerY + this.towerHeight / 2 + 60;
        
        const pulseEffect = () => {
            this.ctx.strokeStyle = `rgba(16, 185, 129, ${1 - radius / maxRadius})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(laptopX, laptopY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            radius += 1;
            
            if (radius < maxRadius) {
                requestAnimationFrame(pulseEffect);
            }
        };
        
        pulseEffect();
    }
    
    updateStatus(text, type) {
        this.statusIndicator.textContent = text;
        this.statusIndicator.className = 'text-sm';
        
        switch (type) {
            case 'idle':
                this.statusIndicator.classList.add('text-gray-400');
                break;
            case 'encoding':
                this.statusIndicator.classList.add('text-yellow-400');
                break;
            case 'transmitting':
                this.statusIndicator.classList.add('text-red-400');
                break;
            case 'decoding':
                this.statusIndicator.classList.add('text-blue-400');
                break;
            case 'complete':
                this.statusIndicator.classList.add('text-green-400');
                break;
        }
    }
    
    resetSimulation() {
        this.isRunning = false;
        this.currentStage = 0;
        this.bitPositions = [];
        this.laserProgress = 0;
        
        // إعادة تعيين واجهة المستخدم
        this.statusIndicator.textContent = 'انتظار الإدخال';
        this.statusIndicator.className = 'text-sm text-gray-400';
        this.receivedMessage.textContent = '-';
        this.transmissionTime.textContent = '0ms';
        this.connectionStatus.textContent = 'جاهز للاتصال';
        this.connectionStatus.parentElement.querySelector('.bg-yellow-500, .bg-green-500').className = 'w-3 h-3 rounded-full bg-green-500 animate-pulse';
        
        // إلغاء أي طلب رسم متحرك
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // إعادة الرسم
        this.draw();
    }
    
    runDemo() {
        // رسائل تجريبية
        const demoMessages = [
            "مرحباً بالاتصالات الضوئية",
            "Li-Fi هو مستقبل الإنترنت",
            "الليزر ينقل البيانات بسرعة الضوء",
            "مشروع تخرج هندسي مبتكر",
            "الاتصالات الضوئية أسرع وأكثر أماناً"
        ];
        
        const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
        this.messageInput.value = randomMessage;
        
        // بدء المحاكاة بعد فترة قصيرة
        setTimeout(() => {
            this.startSimulation();
        }, 500);
    }
    
    textToBinary(text) {
        // تحويل النص إلى ثنائي (UTF-8)
        let binary = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            // استخدام 8 بت لكل حرف (للبساطة)
            binary += charCode.toString(2).padStart(8, '0');
        }
        return binary;
    }
    
    binaryToText(binary) {
        // تحويل الثنائي إلى نص (UTF-8)
        let text = '';
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.substring(i, i + 8);
            if (byte.length === 8) {
                const charCode = parseInt(byte, 2);
                text += String.fromCharCode(charCode);
            }
        }
        return text;
    }
    
    formatBinary(binary) {
        // تنسيق البيانات الثنائية لعرضها بشكل مقروء
        let formatted = '';
        for (let i = 0; i < binary.length; i += 8) {
            if (i > 0) formatted += ' ';
            formatted += binary.substring(i, Math.min(i + 8, binary.length));
        }
        return formatted;
    }
}

// تهيئة المحاكاة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const simulation = new LaserTransmissionSimulation();
    window.laserSimulation = simulation; // لجعل المحاكاة متاحة عالمياً للتجريب
});