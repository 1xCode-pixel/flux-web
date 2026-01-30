export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Промокоды: код -> сумма в рублях
    // Добавляй свои промокоды здесь!
    const PROMOCODES = {
        'FLUX100': 100,
        'FLUX50': 50,
        'WELCOME': 5,
        'START': 10,
        'VIP500': 500,
        'TEST10': 10,
        'BONUS': 75,
        'PREMIUM': 250,
        'MEGA1000': 1000
    };

    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Введите промокод' 
            });
        }
        
        const upperCode = code.toUpperCase().trim();
        const amount = PROMOCODES[upperCode];
        
        if (amount) {
            return res.status(200).json({ 
                success: true, 
                amount: amount,
                message: `Промокод активирован! +${amount} ₽`
            });
        } else {
            return res.status(200).json({ 
                success: false, 
                error: 'Недействительный промокод' 
            });
        }
    } catch (error) {
        console.error('Promo Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
}
