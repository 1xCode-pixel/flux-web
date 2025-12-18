const axios = require('axios');

module.exports = async (req, res) => {
  let { url } = req.query;

  if (!url) {
    return res.status(400).send('URL is required');
  }

  // Если пользователь не ввел протокол, добавляем https
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      responseType: 'arraybuffer' // Важно для картинок и шрифтов
    });

    // Копируем тип контента (html, image, css и т.д.)
    res.setHeader('Content-Type', response.headers['content-type']);
    
    // Пытаемся исправить относительные ссылки (src="/img.png" -> src="site.com/img.png")
    // Это базовая защита от "ломаной" верстки
    let data = response.data;
    const contentType = response.headers['content-type'];
    
    if (contentType && contentType.includes('text/html')) {
        let html = data.toString('utf-8');
        // Получаем корень сайта для замены ссылок
        const urlObj = new URL(url);
        const origin = urlObj.origin;
        
        // Простая замена относительных ссылок на абсолютные (для href и src)
        html = html.replace(/src="\//g, `src="${origin}/`);
        html = html.replace(/href="\//g, `href="${origin}/`);
        
        res.send(html);
    } else {
        res.send(data);
    }

  } catch (error) {
    res.status(500).send(`Flux Error: ${error.message}`);
  }
};
