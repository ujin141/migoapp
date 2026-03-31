# PowerShell script to add payment.testMode/group/back keys to all locale files

$localesDir = "c:\Users\ujin1\Desktop\MIGO\MigoApp\src\i18n\locales"

$translations = @{
    # Already done
    # ko = done
    # en = done
    # ja = done
    
    zh = @{ testMode = '测试模式 — 不会进行实际付款。'; group = '群组'; back = '返回' }
    es = @{ testMode = 'Modo de prueba: no se realizará ningún pago real.'; group = 'Grupo'; back = 'Volver' }
    fr = @{ testMode = "Mode test — aucun paiement réel ne sera prélevé."; group = 'Groupe'; back = 'Retour' }
    de = @{ testMode = 'Testmodus — Es wird keine echte Zahlung vorgenommen.'; group = 'Gruppe'; back = 'Zurück' }
    pt = @{ testMode = 'Modo de teste — nenhum pagamento real será feito.'; group = 'Grupo'; back = 'Voltar' }
    id = @{ testMode = 'Mode uji — tidak ada pembayaran nyata yang dikenakan.'; group = 'Grup'; back = 'Kembali' }
    vi = @{ testMode = 'Chế độ thử nghiệm — không có khoản thanh toán thực.'; group = 'Nhóm'; back = 'Quay lại' }
    th = @{ testMode = 'โหมดทดสอบ — ไม่มีการชำระเงินจริง'; group = 'กลุ่ม'; back = 'กลับ' }
    ar = @{ testMode = 'وضع الاختبار — لن يتم إجراء أي دفع حقيقي.'; group = 'مجموعة'; back = 'رجوع' }
    hi = @{ testMode = 'परीक्षण मोड — कोई वास्तविक भुगतान नहीं।'; group = 'समूह'; back = 'वापस' }
    ru = @{ testMode = 'Тестовый режим — реальная оплата не производится.'; group = 'Группа'; back = 'Назад' }
    tr = @{ testMode = 'Test modu — gerçek ödeme yapılmaz.'; group = 'Grup'; back = 'Geri' }
    it = @{ testMode = 'Modalità test — nessun pagamento reale.'; group = 'Gruppo'; back = 'Indietro' }
    nl = @{ testMode = 'Testmodus — geen echte betaling.'; group = 'Groep'; back = 'Terug' }
    pl = @{ testMode = 'Tryb testowy — nie pobrano rzeczywistej opłaty.'; group = 'Grupa'; back = 'Wróć' }
    sv = @{ testMode = 'Testläge — ingen riktig betalning görs.'; group = 'Grupp'; back = 'Tillbaka' }
    da = @{ testMode = 'Testtilstand — ingen rigtig betaling.'; group = 'Gruppe'; back = 'Tilbage' }
    no = @{ testMode = 'Testmodus — ingen ekte betaling.'; group = 'Gruppe'; back = 'Tilbake' }
    fi = @{ testMode = 'Testitila — ei todellista maksua.'; group = 'Ryhmä'; back = 'Takaisin' }
    cs = @{ testMode = 'Testovací režim — žádná skutečná platba.'; group = 'Skupina'; back = 'Zpět' }
    ro = @{ testMode = 'Mod test — nicio plată reală.'; group = 'Grup'; back = 'Înapoi' }
    hu = @{ testMode = 'Teszt mód — nem történik valódi fizetés.'; group = 'Csoport'; back = 'Vissza' }
    el = @{ testMode = 'Λειτουργία δοκιμής — δεν γίνεται πραγματική πληρωμή.'; group = 'Ομάδα'; back = 'Πίσω' }
    bg = @{ testMode = 'Тестов режим — без реално плащане.'; group = 'Група'; back = 'Назад' }
    uk = @{ testMode = 'Тестовий режим — реальна оплата не здійснюється.'; group = 'Група'; back = 'Назад' }
    he = @{ testMode = 'מצב בדיקה — לא יתבצע תשלום אמיתי.'; group = 'קבוצה'; back = 'חזרה' }
    bn = @{ testMode = 'পরীক্ষা মোড — প্রকৃত পেমেন্ট নেই।'; group = 'গ্রুপ'; back = 'ফিরে যান' }
    ta = @{ testMode = 'சோதனை பயன்முறை — உண்மையான கட்டணம் இல்லை.'; group = 'குழு'; back = 'திரும்பு' }
    te = @{ testMode = 'పరీక్ష మోడ్ — నిజమైన చెల్లింపు లేదు.'; group = 'సమూహం'; back = 'వెనుకకు' }
    kn = @{ testMode = 'ಪರೀಕ್ಷಾ ಮೋಡ್ — ನೈಜ ಪಾವತಿ ಇಲ್ಲ.'; group = 'ಗುಂಪು'; back = 'ಹಿಂದೆ' }
    ml = @{ testMode = 'ടെസ്റ്റ് മോഡ് — യഥാർത്ഥ പേയ്‌മെന്റ് ഇല്ല.'; group = 'ഗ്രൂപ്പ്'; back = 'തിരികെ' }
    gu = @{ testMode = 'ટેસ્ટ મોડ — કોઈ વાસ્તવિક ચુકવણી નહીં.'; group = 'જૂથ'; back = 'પાછળ' }
    mr = @{ testMode = 'चाचणी मोड — वास्तविक पेमेंट नाही.'; group = 'गट'; back = 'मागे' }
    pa = @{ testMode = 'ਟੈਸਟ ਮੋਡ — ਕੋਈ ਅਸਲ ਭੁਗਤਾਨ ਨਹੀਂ।'; group = 'ਸਮੂਹ'; back = 'ਵਾਪਸ' }
    fa = @{ testMode = 'حالت آزمایشی — پرداخت واقعی انجام نمی‌شود.'; group = 'گروه'; back = 'بازگشت' }
    ur = @{ testMode = 'ٹیسٹ موڈ — کوئی حقیقی ادائیگی نہیں۔'; group = 'گروپ'; back = 'واپس' }
    sw = @{ testMode = 'Hali ya majaribio — hakuna malipo halisi.'; group = 'Kikundi'; back = 'Rudi' }
    zu = @{ testMode = 'Imodi yokuhlola — akukho inkokhelo yangempela.'; group = 'Iqembu'; back = 'Buyela' }
    ca = @{ testMode = "Mode de prova: cap pagament real."; group = 'Grup'; back = 'Enrere' }
    hr = @{ testMode = 'Testni način — nema stvarnog plaćanja.'; group = 'Grupa'; back = 'Natrag' }
    sk = @{ testMode = 'Testovací režim — žiadna skutočná platba.'; group = 'Skupina'; back = 'Späť' }
    sl = @{ testMode = 'Testni način — ni resničnega plačila.'; group = 'Skupina'; back = 'Nazaj' }
    lv = @{ testMode = 'Testa režīms — nav faktiska maksājuma.'; group = 'Grupa'; back = 'Atpakaļ' }
    lt = @{ testMode = 'Bandomasis režimas — nėra realaus mokėjimo.'; group = 'Grupė'; back = 'Atgal' }
    et = @{ testMode = 'Testrežiim — reaalset makset ei võeta.'; group = 'Grupp'; back = 'Tagasi' }
    is = @{ testMode = 'Prófunarhamur — engin raunveruleg greiðsla.'; group = 'Hópur'; back = 'Til baka' }
}

$updated = 0
$skipped = 0

foreach ($file in Get-ChildItem -Path $localesDir -Filter "*.ts") {
    $lang = $file.BaseName
    
    # Skip already processed
    if ($lang -eq "ko" -or $lang -eq "en" -or $lang -eq "ja") {
        Write-Host "⏭️  Skipping $lang (already done)"
        continue
    }
    
    if (-not $translations.ContainsKey($lang)) {
        Write-Host "⚠️  No translation for: $lang"
        $skipped++
        continue
    }
    
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Check if testMode already exists
    if ($content -match '"testMode"') {
        Write-Host "⏭️  $lang already has testMode"
        continue
    }
    
    $t = $translations[$lang]
    $testMode = $t.testMode
    $group = $t.group
    $back = $t.back
    
    # Find and replace the noMethod line (last one in payment section)
    # Pattern: "noMethod": "..." followed by newline and }
    $pattern = '("noMethod"\s*:\s*"[^"]*")\s*\n(\s*\})'
    $replacement = "`$1,`n    `"testMode`": `"$testMode`",`n    `"group`": `"$group`",`n    `"back`": `"$back`"`n`$2"
    
    $newContent = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    
    if ($newContent -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "✅ Updated $lang"
        $updated++
    } else {
        Write-Host "⚠️  Pattern not found in $lang"
        $skipped++
    }
}

Write-Host "`n📊 Done: $updated updated, $skipped skipped"
