# מעקב התנהגות - תוסף Chrome ל-Gmail

תוסף צף ל-Gmail שמאפשר גישה מהירה למערכת מעקב התנהגות של בית התלמוד.

## פיצ'רים

- 🎓 **כפתור צף** בפינה השמאלית של Gmail
- 📋 **פאנל מהיר** לאירועים, משימות, חתימות הורים
- 📞 **פעולות מהקו /8** (קו טלפוני של מעקב התנהגות)
- 🔗 **קישור ישיר** לאתר המלא

## התקנה (Developer Mode)

1. פתח את Chrome
2. גש ל-`chrome://extensions`
3. הפעל **"מצב מפתח"** בפינה הימנית
4. לחץ **"טען תוסף לא ארוז"**
5. בחר את התיקייה `bht-gmail-extension`
6. התוסף מותקן! פתח Gmail ותראה כפתור צף `🎓` בפינה השמאלית

## ארכיטקטורה

- `manifest.json` - מניפסט Chrome v3
- `content.js` - מזריק את הכפתור הצף לGmail
- `floating.css` - עיצוב הפאנל
- `popup.html` - חלון popup של התוסף

## חיבור

התוסף מחובר ל-Apps Script: `AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt`
ולאתר: `https://beit-hatalmud.github.io/cheder-bht/`
