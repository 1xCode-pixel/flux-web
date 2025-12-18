const axios = require('axios');

module.exports = async (req, res) => {
  let { url } = req.query;

  if (!url) {
    return res.status(400).send('URL is required');
  }

  // Если протокол не указан, добавляем https
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  try {
    // Делаем запрос к целевому сайту
    const response = await axios.get(url, {
      headers: {
        // Притворяемся обычным браузером Chrome на Windows
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      responseType: 'arraybuffer', // Важно: скачиваем данные как байты (для картинок)
      maxRedirects: 5,             // Разрешаем переходы (vk.com -> id.vk.com)
      validateStatus: () => true   // Не выдавать ошибку, даже если сайт вернул 404
    });

    // --- 1. ОПРЕДЕЛЯЕМ ФИНАЛЬНЫЙ URL ---
    // Это важно: если мы запросили vk.com, а нас перекинуло на m.vk.com,
    // мы должны искать картинки на m.vk.com
    const finalUrl = response.request.res.responseUrl || url;


    // --- 2. ЧИСТИМ ЗАГОЛОВКИ ЗАЩИТЫ ---
    // Убираем всё, что запрещает сайту работать в iframe
    const blockedHeaders = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'content-encoding', // Axios уже распаковал данные, этот заголовок лишний
        'transfer-encoding'
    ];

    // Копируем заголовки от сайта к пользователю, пропуская плохие
    Object.keys(response.headers).forEach(key => {
        if (!blockedHeaders.includes(key.toLowerCase())) {
            res.setHeader(key, response.headers[key]);
        }
    });


    // --- 3. ОБРАБОТКА КОНТЕНТА ---
    const contentType = response.headers['content-type'] || '';

    if (contentType.includes('text/html')) {
        // Если это HTML страница - превращаем байты в текст
        let html = response.data.toString('utf-8');

        // ВНЕДРЕНИЕ <BASE>: Это чинит картинки и CSS
        // Мы говорим браузеру: все относительные ссылки (src="/img.png") бери с finalUrl
        const baseTag = `<base href="${finalUrl}">`;
        
        // Вставляем сразу после <head> или в начало, если head нет
        if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>${baseTag}`);
        } else {
            html = baseTag + html;
        }

        // Дополнительно: пытаемся превратить ссылки на скрипты в абсолютные
        // (Решает проблему с подгрузкой некоторых JS модулей)
        res.send(html);
    } else {
        // Если это картинка, шрифт или скрипт - отдаем как есть (байтами)
        res.send(response.data);
    }

  } catch (error) {
    console.error("Proxy Error:", error.message);
    res.status(500).send(`Flux Proxy Error: Не удалось открыть сайт. ${error.message}`);
  }
};
