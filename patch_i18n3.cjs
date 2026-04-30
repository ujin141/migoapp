// [ignoring loop detection]
const fs = require('fs');
const path = require('path');
const LOCALES = path.join(__dirname, 'src/i18n/locales');

const MARKERS = {
  map:     { start: '  "map": {\n    "distanceUnknown": "Distance unknown"', end: '    "loading": "Loading map..."\n  },' },
  match:   { start: '  "match": {\n    "title": "Match",\n    "like": "Like",\n    "pass": "Pass"', end: '    "traveler": "Traveler"\n  },' },
  chat:    { start: '  "chat": {\n    "title": "Chats",\n    "searchPlaceholder": "Search conversations..."', end: '    "noShowReportDesc": "No-show report submitted. Leaving the chat room."\n  },' },
  discover:{ start: '  "discover": {\n    "groups": "Travel Groups"', end: '    "detailView": "View details"\n  },' }
};

function buildMap(t) {
  return `  "map": {
    "distanceUnknown": "${t.distanceUnknown}",
    "toast": {
      "traveler_found": { "title": "${t.traveler_found_title}", "desc": "${t.traveler_found_desc}" },
      "hotplace_found": { "title": "${t.hotplace_found_title}", "desc": "${t.hotplace_found_desc}" },
      "group_found":    { "title": "${t.group_found_title}",    "desc": "${t.group_found_desc}" },
      "photo_found":    { "title": "${t.photo_found_title}",    "desc": "${t.photo_found_desc}" }
    },
    "profile": "${t.profile}", "destination": "${t.destination}", "schedule": "${t.schedule}",
    "travelStyle": "${t.travelStyle}", "reset": "${t.reset}", "viewProfile": "${t.viewProfile}",
    "locationNoAuth": "${t.locationNoAuth}", "locationUnknown": "${t.locationUnknown}",
    "matchFail": "${t.matchFail}", "matchSuccess": "${t.matchSuccess}", "newVibe": "${t.newVibe}",
    "filterApplied": "${t.filterApplied}", "user": "${t.user}", "bioPlaceholder": "${t.bioPlaceholder}",
    "destPlaceholder": "${t.destPlaceholder}", "datesUnknown": "${t.datesUnknown}",
    "genderUnknown": "${t.genderUnknown}", "korean": "${t.korean}", "seoul": "${t.seoul}",
    "host": "${t.host}", "today": "${t.today}", "searchingPlaces": "${t.searchingPlaces}",
    "connectingPlaces": "${t.connectingPlaces}", "hostLabel": "${t.hostLabel}",
    "mapFilter": "${t.mapFilter}", "distanceRadius": "${t.distanceRadius}", "apply": "${t.apply}",
    "lightningMatchDesc": "${t.lightningMatchDesc}", "lightningMatchTitle": "${t.lightningMatchTitle}",
    "lightningMatchProgress1": "${t.lightningMatchProgress1}", "lightningMatchProgress2": "${t.lightningMatchProgress2}",
    "enterChat": "${t.enterChat}", "applyJoin": "${t.applyJoin}", "locationShareOff": "${t.locationShareOff}",
    "premium": "PREMIUM", "normal": "${t.normal}", "cancelLike": "${t.cancelLike}",
    "like": "${t.like}", "me": "${t.me}", "title": "${t.title}",
    "nearby": "${t.nearby}", "noNearby": "${t.noNearby}", "loading": "${t.loading}"
  },`;
}

function buildMatch(t) {
  return `  "match": {
    "title": "${t.title}", "like": "${t.like}", "pass": "${t.pass}",
    "superLike": "${t.superLike}", "matched": "${t.matched}", "startChat": "${t.startChat}",
    "keepSwiping": "${t.keepSwiping}", "noMore": "${t.noMore}", "filters": "${t.filters}",
    "distance": "${t.distance}", "age": "${t.age}", "filterGender": "${t.filterGender}",
    "filterDist": "${t.filterDist}", "filterTitle": "${t.filterTitle}", "filterReset": "${t.filterReset}",
    "empty": "${t.empty}", "emptyDesc": "${t.emptyDesc}", "score": "${t.score}",
    "superLikesLeft": "${t.superLikesLeft}", "refresh": "${t.refresh}",
    "superLikeModal": {
      "title": "${t.slTitle}", "todayLeft": "${t.slTodayLeft}", "msgLabel": "${t.slMsgLabel}",
      "msgOptional": "${t.slMsgOptional}", "msgPlaceholder": "${t.slMsgPlaceholder}",
      "send": "${t.slSend}", "cancel": "${t.slCancel}",
      "quickMsg1": "${t.slQ1}", "quickMsg2": "${t.slQ2}", "quickMsg3": "${t.slQ3}", "quickMsg4": "${t.slQ4}"
    },
    "limitReached": "${t.limitReached}", "limitReachedDesc": "${t.limitReachedDesc}",
    "toast": "${t.toast}", "toastDesc": "${t.toastDesc}", "noLocation": "${t.noLocation}",
    "filterDesc": "${t.filterDesc}", "filterAge": "${t.filterAge}", "filterAgePlus": "${t.filterAgePlus}",
    "filterLang": "${t.filterLang}", "filterLangPlus": "${t.filterLangPlus}",
    "filterMBTI": "MBTI", "traveler": "${t.traveler}"
  },`;
}

function buildChat(t) {
  return `  "chat": {
    "title": "${t.title}", "searchPlaceholder": "${t.searchPlaceholder}", "noChats": "${t.noChats}",
    "online": "${t.online}", "offline": "${t.offline}", "typing": "${t.typing}",
    "deleteChat": "${t.deleteChat}", "translateFail": "${t.translateFail}", "sendFail": "${t.sendFail}",
    "unknownLocation": "${t.unknownLocation}", "locationPermErr": "${t.locationPermErr}",
    "subtitle": "${t.subtitle}", "search": "${t.search}", "noResult": "${t.noResult}",
    "muted": "${t.muted}", "viewProfile": "${t.viewProfile}", "muteOn": "${t.muteOn}", "muteOff": "${t.muteOff}",
    "report": "${t.report}", "locationShared": "${t.locationShared}", "locationPermReq": "${t.locationPermReq}",
    "scheduleRequired": "${t.scheduleRequired}", "translateFailDesc": "${t.translateFailDesc}",
    "mutedOn": "${t.mutedOn}", "mutedOff": "${t.mutedOff}", "reportTitle": "${t.reportTitle}",
    "reportDesc": "${t.reportDesc}", "reportNeed": "${t.reportNeed}", "reportDone": "${t.reportDone}",
    "reportDoneDesc": "${t.reportDoneDesc}", "deleteTitle": "${t.deleteTitle}", "deleteDesc": "${t.deleteDesc}",
    "deleteConfirm": "${t.deleteConfirm}", "deleted": "${t.deleted}", "locShared": "${t.locShared}",
    "meetProposal": "${t.meetProposal}", "meetDate": "${t.meetDate}", "meetPlace": "${t.meetPlace}",
    "meetPlaceholder": "${t.meetPlaceholder}", "meetSend": "${t.meetSend}", "meetDone": "${t.meetDone}",
    "meetNeed": "${t.meetNeed}", "input": "${t.input}", "inputMuted": "${t.inputMuted}",
    "shareLocation": "${t.shareLocation}", "cancel": "${t.cancel}",
    "reportReasons": ${JSON.stringify(t.reportReasons, null, 6).replace(/\n/g, '\n    ')},
    "autoTranslate": "${t.autoTranslate}", "translating": "${t.translating}",
    "viewOriginal": "${t.viewOriginal}", "translate": "${t.translate}", "translated": "${t.translated}",
    "myCurrentLocation": "${t.myCurrentLocation}", "locationUnknown": "${t.locationUnknown}",
    "openMap": "${t.openMap}", "ourSchedule": "${t.ourSchedule}", "read": "${t.read}",
    "dailyLimitTitle": "${t.dailyLimitTitle}", "dailyLimitDesc": "${t.dailyLimitDesc}",
    "lockedPlaceholder": "${t.lockedPlaceholder}", "meetProposalBtn": "${t.meetProposalBtn}",
    "scheduleShareBtn": "${t.scheduleShareBtn}", "scheduleShare": "${t.scheduleShare}",
    "scheduleWhen": "${t.scheduleWhen}", "scheduleDatePlaceholder": "${t.scheduleDatePlaceholder}",
    "scheduleWhat": "${t.scheduleWhat}", "scheduleContentPlaceholder": "${t.scheduleContentPlaceholder}",
    "safeCompanionTitle": "${t.safeCompanionTitle}", "safeCompanionDesc": "${t.safeCompanionDesc}",
    "safeCompanionBtn": "${t.safeCompanionBtn}", "noShowReport": "${t.noShowReport}",
    "noShowReportDesc": "${t.noShowReportDesc}"
  },`;
}

function buildDiscover(t) {
  return `  "discover": {
    "groups": "${t.groups}", "community": "${t.community}", "all": "${t.all}",
    "recruiting": "${t.recruiting}", "almostFull": "${t.almostFull}",
    "searchPlaceholder": "${t.searchPlaceholder}", "hot": "${t.hot}", "title": "${t.title}",
    "write": "${t.write}", "writeTitle": "${t.writeTitle}", "writeTitlePlaceholder": "${t.writeTitlePlaceholder}",
    "writeContentPlaceholder": "${t.writeContentPlaceholder}", "writeTagPlaceholder": "${t.writeTagPlaceholder}",
    "photoAdd": "${t.photoAdd}", "photoChange": "${t.photoChange}", "post": "${t.post}",
    "postDone": "${t.postDone}", "postNeed": "${t.postNeed}", "deletePost": "${t.deletePost}",
    "deleteGroup": "${t.deleteGroup}", "confirmDelete": "${t.confirmDelete}",
    "confirmDeleteGroup": "${t.confirmDeleteGroup}", "newPost": "${t.newPost}",
    "firstComment": "${t.firstComment}", "commentPlaceholder": "${t.commentPlaceholder}",
    "comments": "${t.comments}", "clipCopied": "${t.clipCopied}", "joinGroup": "${t.joinGroup}",
    "joined": "${t.joined}", "full": "${t.full}", "fullDesc": "${t.fullDesc}",
    "alreadyJoined": "${t.alreadyJoined}", "savedOk": "${t.savedOk}", "savedRemove": "${t.savedRemove}",
    "delete": "${t.delete}", "detailView": "${t.detailView}"
  },`;
}

const DATA = {
  hi: {
    map: {
      distanceUnknown:"दूरी अज्ञात", traveler_found_title:"👥 पास में यात्री मिला!", traveler_found_desc:"{{name}} केवल {{distance}} दूर है (लगभग {{time}} मिनट पैदल)!", hotplace_found_title:"{{emoji}} पास का {{category}} मिला!", hotplace_found_desc:"'{{name}}' के पास लोग इकट्ठे हो रहे हैं — {{distance}} दूर (लगभग {{time}} मिनट पैदल)!", group_found_title:"🍻 पास में मीटअप हो रहा है", group_found_desc:"'{{title}}' मीटअप केवल {{distance}} दूर हो रहा है!", photo_found_title:"📸 लाइव लोकल फोटो फीड", photo_found_desc:"{{distance}} दूर अभी एक फोटो पोस्ट हुई!",
      profile:"प्रोफ़ाइल", destination:"गंतव्य", schedule:"शेड्यूल", travelStyle:"यात्रा शैली", reset:"रीसेट", viewProfile:"प्रोफ़ाइल देखें", locationNoAuth:"स्थान अनुमति अस्वीकृत", locationUnknown:"स्थान अज्ञात", matchFail:"मैच विफल", matchSuccess:"मैच सफल!", newVibe:"नया क्षेत्र एक्सप्लोर किया", filterApplied:"फ़िल्टर लागू।", user:"उपयोगकर्ता", bioPlaceholder:"कोई परिचय नहीं।", destPlaceholder:"गंतव्य अज्ञात", datesUnknown:"तारीखें अज्ञात", genderUnknown:"अज्ञात", korean:"कोरियाई", seoul:"सियोल", host:"होस्ट", today:"आज", searchingPlaces:"पास की जगहें खोज रहे हैं...", connectingPlaces:"Google Places से जुड़ रहे हैं", hostLabel:"आयोजक", mapFilter:"मैप फ़िल्टर", distanceRadius:"दूरी त्रिज्या", apply:"लागू करें", lightningMatchDesc:"हॉट स्पॉट पर जाएं और 4~6 लोगों से ऑटो-मैच करें!", lightningMatchTitle:"यात्रा समूह बना रहे हैं...", lightningMatchProgress1:"3~5 यादृच्छिक सदस्यों को आमंत्रित कर रहे हैं", lightningMatchProgress2:"लोकप्रिय स्थानों पर 🚀", enterChat:"चैट में जाएं", applyJoin:"शामिल होने के लिए आवेदन करें", locationShareOff:"स्थान साझा बंद", normal:"सामान्य", cancelLike:"लाइक हटाएं", like:"पसंद", me:"मैं", title:"मैप", nearby:"पास के यात्री", noNearby:"पास में कोई यात्री नहीं", loading:"मैप लोड हो रहा है..."
    },
    match: {
      title:"मैच", like:"पसंद", pass:"स्किप", superLike:"सुपर लाइक", matched:"मैच हो गया!", startChat:"चैट शुरू करें", keepSwiping:"आगे देखें", noMore:"आपने पास के सभी यात्री देख लिए!", filters:"फ़िल्टर", distance:"दूरी", age:"उम्र", filterGender:"किससे मिलना है", filterDist:"दूरी त्रिज्या", filterTitle:"फ़िल्टर सेटिंग्स", filterReset:"रीसेट", empty:"आपने पास के सभी यात्री देख लिए!", emptyDesc:"नए यात्री जल्द आएंगे", score:"मैच स्कोर", superLikesLeft:"सुपर लाइक {{count}} बार", refresh:"फिर देखें", slTitle:"{{name}} को सुपर लाइक", slTodayLeft:"आज {{count}} बाकी हैं", slMsgLabel:"संदेश भेजें", slMsgOptional:"(वैकल्पिक)", slMsgPlaceholder:"मैं भी {{dest}} जा रहा हूं! साथ यात्रा करें? ✈️", slSend:"सुपर लाइक भेजें", slCancel:"रद्द करें", slQ1:"मैं भी {{dest}} जा रहा हूं! 🙌", slQ2:"साथ यात्रा करते हैं! ✈️", slQ3:"हमारी रुचियां मिलती-जुलती हैं 😊", slQ4:"साथ में अच्छे रेस्तरां खोजें 🍜", limitReached:"आज के सभी सुपर लाइक इस्तेमाल हो गए ⭐", limitReachedDesc:"कल फिर 3 बार मिलेंगे", toast:"{{name}} को सुपर लाइक भेजा!", toastDesc:"विशेष सूचना भेजी जाएगी", noLocation:"स्थान सेट नहीं", filterDesc:"खोज फ़िल्टर सेट करें।", filterAge:"आयु सीमा सेट करें", filterAgePlus:"आयु फ़िल्टर", filterLang:"पसंदीदा भाषा", filterLangPlus:"कई भाषाएं चुनें", traveler:"यात्री"
    },
    chat: {
      title:"चैट", searchPlaceholder:"बातचीत खोजें...", noChats:"अभी कोई बातचीत नहीं", online:"ऑनलाइन", offline:"ऑफलाइन", typing:"टाइप कर रहे हैं...", deleteChat:"बातचीत हटाएं", translateFail:"अनुवाद विफल", sendFail:"भेजना विफल", unknownLocation:"अज्ञात स्थान", locationPermErr:"स्थान अनुमति अस्वीकृत", subtitle:"मैच किए गए यात्रियों से चैट करें", search:"बातचीत खोजें...", noResult:"कोई परिणाम नहीं", muted:"सूचनाएं बंद", viewProfile:"प्रोफ़ाइल देखें", muteOn:"सूचनाएं बंद करें 🔕", muteOff:"सूचनाएं चालू करें 🔔", report:"रिपोर्ट", locationShared:"📍 मेरा स्थान साझा किया!", locationPermReq:"स्थान अनुमति आवश्यक", scheduleRequired:"सभी तारीखें और शेड्यूल दर्ज करें", translateFailDesc:"फिर कोशिश करें", mutedOn:"{{name}} की सूचनाएं बंद 🔕", mutedOff:"{{name}} की सूचनाएं चालू 🔔", reportTitle:"रिपोर्ट", reportDesc:"बताएं {{name}} को रिपोर्ट क्यों कर रहे हैं", reportNeed:"रिपोर्ट का कारण दर्ज करें", reportDone:"रिपोर्ट मिली", reportDoneDesc:"हम समीक्षा के बाद कार्रवाई करेंगे। धन्यवाद।", deleteTitle:"बातचीत हटाएं?", deleteDesc:"हटाई गई बातचीत वापस नहीं आ सकती", deleteConfirm:"हटाएं", deleted:"बातचीत हटाई गई", locShared:"📍 वर्तमान स्थान साझा किया", meetProposal:"मिलने का प्रस्ताव", meetDate:"तारीख", meetPlace:"जगह", meetPlaceholder:"उदा: खाओसन रोड प्रवेश", meetSend:"प्रस्ताव भेजें", meetDone:"मिलने का प्रस्ताव भेजा! 🎉", meetNeed:"तारीख और जगह दर्ज करें", input:"संदेश लिखें...", inputMuted:"🔕 सूचनाएं बंद बातचीत।", shareLocation:"स्थान साझा करें", cancel:"रद्द", reportReasons:["अनुचित शब्द या व्यवहार","स्पैम / विज्ञापन","नकली प्रोफ़ाइल","आपत्तिजनक सामग्री","अन्य"], autoTranslate:"ऑटो-अनुवाद ", translating:"अनुवाद हो रहा है...", viewOriginal:"मूल देखें", translate:"अनुवाद", translated:"अनुवादित ", myCurrentLocation:"मेरा वर्तमान स्थान", locationUnknown:"स्थान अज्ञात", openMap:"मैप खोलें", ourSchedule:"हमारा शेड्यूल 🗺️", read:"पढ़ा", dailyLimitTitle:"दैनिक संदेश सीमा पहुंची", dailyLimitDesc:"असीमित संदेश के लिए Plus अपग्रेड करें 👑", lockedPlaceholder:"संदेश भेजने के लिए Plus सब्सक्राइब करें", meetProposalBtn:"मिलने का प्रस्ताव", scheduleShareBtn:"शेड्यूल साझा करें", scheduleShare:"शेड्यूल साझा करें", scheduleWhen:"कब?", scheduleDatePlaceholder:"उदा: 20 मई, दोपहर 3 बजे", scheduleWhat:"योजना क्या है?", scheduleContentPlaceholder:"उदा: कैफे घूमना फिर साथ रात का खाना", safeCompanionTitle:"🛡️ सुरक्षित साथी मोड चालू!", safeCompanionDesc:"आपकी वर्तमान साथी स्थिति आपके अभिभावक और Migo सुरक्षा केंद्र के साथ साझा हो रही है।", safeCompanionBtn:"सुरक्षित साथी मोड", noShowReport:"अनुपस्थिति रिपोर्ट और चैट छोड़ें", noShowReportDesc:"अनुपस्थिति रिपोर्ट सबमिट हुई। चैट छोड़ रहे हैं।"
    },
    discover: {
      groups:"यात्रा समूह", community:"समुदाय", all:"सभी", recruiting:"भर्ती हो रही है", almostFull:"लगभग भरा", searchPlaceholder:"गंतव्य, यात्रा शैली खोजें...", hot:"लोकप्रिय पोस्ट", title:"एक्सप्लोर", write:"पोस्ट लिखें", writeTitle:"पोस्ट लिखें", writeTitlePlaceholder:"शीर्षक दर्ज करें", writeContentPlaceholder:"यात्रा टिप्स, अनुशंसित स्थान, साथी खोजें...", writeTagPlaceholder:"टैग (उदा: बैंकॉक)", photoAdd:"फोटो जोड़ें", photoChange:"फोटो बदलें", post:"पोस्ट", postDone:"पोस्ट हो गई! 🎉", postNeed:"शीर्षक और सामग्री दर्ज करें", deletePost:"पोस्ट हटाई गई", deleteGroup:"यात्रा समूह हटाया गया 🗑️", confirmDelete:"यह पोस्ट हटाएं?", confirmDeleteGroup:"यह यात्रा समूह हटाएं?", newPost:"नई पोस्ट! 🔔", firstComment:"पहला टिप्पणी करें 💬", commentPlaceholder:"टिप्पणी दर्ज करें...", comments:"टिप्पणी {{count}}", clipCopied:"क्लिपबोर्ड में कॉपी! 📋", joinGroup:"शामिल हों", joined:"शामिल", full:"समूह भरा 😢", fullDesc:"दूसरा समूह खोजें?", alreadyJoined:"आप पहले से इस समूह में हैं।", savedOk:"सहेजा ✨", savedRemove:"सहेजना रद्द", delete:"हटाएं", detailView:"विवरण देखें"
    }
  },
  tr: {
    map: {
      distanceUnknown:"Mesafe bilinmiyor", traveler_found_title:"👥 Yakında gezgin bulundu!", traveler_found_desc:"{{name}} sadece {{distance}} uzakta (yaklaşık {{time}} dakika yürüme)!", hotplace_found_title:"{{emoji}} En yakın {{category}} bulundu!", hotplace_found_desc:"'{{name}}' yakınında insanlar toplanıyor — {{distance}} uzakta (yaklaşık {{time}} dakika)!", group_found_title:"🍻 Yakında buluşma devam ediyor", group_found_desc:"'{{title}}' buluşması sadece {{distance}} uzakta!", photo_found_title:"📸 Canlı yerel fotoğraf akışı", photo_found_desc:"{{distance}} uzakta yeni fotoğraf paylaşıldı!",
      profile:"Profil", destination:"Hedef", schedule:"Program", travelStyle:"Seyahat stili", reset:"Sıfırla", viewProfile:"Profili gör", locationNoAuth:"Konum izni reddedildi", locationUnknown:"Konum bilinmiyor", matchFail:"Eşleşme başarısız", matchSuccess:"Eşleşme başarılı!", newVibe:"Yeni yarıçap keşfedildi", filterApplied:"Filtre uygulandı.", user:"Kullanıcı", bioPlaceholder:"Açıklama yok.", destPlaceholder:"Hedef bilinmiyor", datesUnknown:"Tarihler bilinmiyor", genderUnknown:"Bilinmiyor", korean:"Korece", seoul:"Seul", host:"Ev sahibi", today:"Bugün", searchingPlaces:"Yakın yerler aranıyor...", connectingPlaces:"Google Places bağlanıyor", hostLabel:"Organizatör", mapFilter:"Harita filtresi", distanceRadius:"Mesafe yarıçapı", apply:"Uygula", lightningMatchDesc:"Popüler bir yere git ve 4~6 kişiyle otomatik eşleş!", lightningMatchTitle:"Seyahat grubu oluşturuluyor...", lightningMatchProgress1:"3~5 rastgele üye davet ediliyor", lightningMatchProgress2:"popüler yerlerde 🚀", enterChat:"Sohbete gir", applyJoin:"Katılım başvurusu yap", locationShareOff:"Konum paylaşımı kapalı", normal:"Normal", cancelLike:"Beğeniyi geri al", like:"Beğen", me:"Ben", title:"Harita", nearby:"Yakındaki gezginler", noNearby:"Yakında gezgin yok", loading:"Harita yükleniyor..."
    },
    match: {
      title:"Eşleşme", like:"Beğen", pass:"Geç", superLike:"Süper Beğeni", matched:"Eşleşti!", startChat:"Sohbet başlat", keepSwiping:"Devam et", noMore:"Yakındaki tüm gezginleri gördünüz!", filters:"Filtreler", distance:"Mesafe", age:"Yaş", filterGender:"Kiminle tanışacaksın", filterDist:"Mesafe yarıçapı", filterTitle:"Filtre ayarları", filterReset:"Sıfırla", empty:"Yakındaki tüm gezginleri gördünüz!", emptyDesc:"Yeni gezginler yakında görünecek", score:"Eşleşme puanı", superLikesLeft:"Süper Beğeni {{count}} kez", refresh:"Tekrar gör", slTitle:"{{name}}'e Süper Beğeni", slTodayLeft:"Bugün {{count}} kaldı", slMsgLabel:"Mesaj gönder", slMsgOptional:"(isteğe bağlı)", slMsgPlaceholder:"Ben de {{dest}}'e gidiyorum! Birlikte gezelim mi? ✈️", slSend:"Süper Beğeni gönder", slCancel:"İptal", slQ1:"Ben de {{dest}}'e gidiyorum! 🙌", slQ2:"Birlikte seyahat edelim! ✈️", slQ3:"Benzer ilgi alanlarımız var sanırım 😊", slQ4:"Birlikte güzel restoranlar keşfedelim 🍜", limitReached:"Bugünkü tüm Süper Beğenileri kullandım ⭐", limitReachedDesc:"Yarın tekrar 3 kullanabilirsin", toast:"{{name}}'e süper beğeni gönderdim!", toastDesc:"Karşı tarafa özel bildirim gönderilecek", noLocation:"Konum ayarlanmadı", filterDesc:"Arama filtrelerini ayarla.", filterAge:"Yaş aralığı ayarla", filterAgePlus:"Yaş filtresi", filterLang:"Tercih edilen dil", filterLangPlus:"Çoklu dil seçimi", traveler:"Gezgin"
    },
    chat: {
      title:"Sohbetler", searchPlaceholder:"Konuşma ara...", noChats:"Henüz konuşma yok", online:"Çevrimiçi", offline:"Çevrimdışı", typing:"Yazıyor...", deleteChat:"Konuşmayı sil", translateFail:"Çeviri başarısız", sendFail:"Gönderme başarısız", unknownLocation:"Bilinmeyen konum", locationPermErr:"Konum izni reddedildi", subtitle:"Eşleşen gezginlerle sohbet et", search:"Konuşma ara...", noResult:"Sonuç bulunamadı", muted:"Bildirimler kapalı", viewProfile:"Profili gör", muteOn:"Bildirimleri kapat 🔕", muteOff:"Bildirimleri aç 🔔", report:"Şikayet et", locationShared:"📍 Konumumu paylaştım!", locationPermReq:"Konum izni gerekli", scheduleRequired:"Lütfen tüm tarihleri ve programı girin", translateFailDesc:"Lütfen tekrar deneyin", mutedOn:"{{name}}'in bildirimleri kapatıldı 🔕", mutedOff:"{{name}}'in bildirimleri açıldı 🔔", reportTitle:"Şikayet", reportDesc:"{{name}}'i neden şikayet ettiğinizi söyleyin", reportNeed:"Şikayet sebebini girin", reportDone:"Şikayet alındı", reportDoneDesc:"İnceledikten sonra işlem yapacağız. Teşekkürler.", deleteTitle:"Konuşma silinsin mi?", deleteDesc:"Silinen konuşmalar geri alınamaz", deleteConfirm:"Sil", deleted:"Konuşma silindi", locShared:"📍 Mevcut konumumu paylaştım", meetProposal:"Buluşma önerisi", meetDate:"Tarih", meetPlace:"Yer", meetPlaceholder:"Örn: Khaosan Road girişi", meetSend:"Öneri gönder", meetDone:"Buluşma önerisi gönderildi! 🎉", meetNeed:"Tarih ve yer girin", input:"Mesaj yaz...", inputMuted:"🔕 Bildirimi kapalı konuşma.", shareLocation:"Konum paylaş", cancel:"İptal", reportReasons:["Uygunsuz söz veya davranış","Spam / Reklam","Sahte profil","Rahatsız edici içerik","Diğer"], autoTranslate:"Otomatik çeviri ", translating:"Çevriliyor...", viewOriginal:"Orijinali gör", translate:"Çevir", translated:"Çevrildi ", myCurrentLocation:"Mevcut konumum", locationUnknown:"Konum bilinmiyor", openMap:"Haritayı aç", ourSchedule:"Programımız 🗺️", read:"Okundu", dailyLimitTitle:"Günlük mesaj limitine ulaşıldı", dailyLimitDesc:"Sınırsız mesaj için Plus'a yükselt 👑", lockedPlaceholder:"Mesaj göndermek için Plus'a abone ol", meetProposalBtn:"Buluşma öner", scheduleShareBtn:"Programı paylaş", scheduleShare:"Programı paylaş", scheduleWhen:"Ne zaman?", scheduleDatePlaceholder:"Örn: 20 Mayıs, saat 15:00", scheduleWhat:"Plan ne?", scheduleContentPlaceholder:"Örn: Kafe turu sonra birlikte akşam yemeği", safeCompanionTitle:"🛡️ Güvenli Arkadaş Modu açık!", safeCompanionDesc:"Mevcut durumunuz koruyucunuzla ve Migo güvenlik merkeziyle paylaşılıyor.", safeCompanionBtn:"Güvenli Arkadaş Modu", noShowReport:"Gelmeme bildir ve sohbetten çık", noShowReportDesc:"Gelmeme bildirimi gönderildi. Sohbetten çıkılıyor."
    },
    discover: {
      groups:"Seyahat grupları", community:"Topluluk", all:"Tümü", recruiting:"Üye alınıyor", almostFull:"Neredeyse dolu", searchPlaceholder:"Hedef, seyahat stili ara...", hot:"Popüler gönderiler", title:"Keşfet", write:"Gönderi yaz", writeTitle:"Gönderi yaz", writeTitlePlaceholder:"Başlık girin", writeContentPlaceholder:"Seyahat ipuçları, önerilen yerler, arkadaş ara...", writeTagPlaceholder:"Etiketler (örn: Bangkok)", photoAdd:"Fotoğraf ekle", photoChange:"Fotoğrafı değiştir", post:"Paylaş", postDone:"Gönderi yayınlandı! 🎉", postNeed:"Başlık ve içerik girin", deletePost:"Gönderi silindi", deleteGroup:"Seyahat grubu silindi 🗑️", confirmDelete:"Bu gönderiyi sil?", confirmDeleteGroup:"Bu seyahat grubunu sil?", newPost:"Yeni gönderi yayınlandı! 🔔", firstComment:"İlk yorumu yap 💬", commentPlaceholder:"Yorum girin...", comments:"Yorum {{count}}", clipCopied:"Panoya kopyalandı! 📋", joinGroup:"Katıl", joined:"Katıldı", full:"Grup dolu 😢", fullDesc:"Başka grup aransın mı?", alreadyJoined:"Bu gruba zaten katıldınız.", savedOk:"Kaydedildi ✨", savedRemove:"Kaydetme iptal edildi", delete:"Sil", detailView:"Detayları gör"
    }
  },
  it: {
    map: {
      distanceUnknown:"Distanza sconosciuta", traveler_found_title:"👥 Viaggiatore nelle vicinanze scoperto!", traveler_found_desc:"{{name}} è a solo {{distance}} (circa {{time}} min a piedi)!", hotplace_found_title:"{{emoji}} Il {{category}} più vicino!", hotplace_found_desc:"Le persone si stanno radunando vicino a '{{name}}' — a {{distance}} (circa {{time}} min a piedi)!", group_found_title:"🍻 Meetup nelle vicinanze in corso", group_found_desc:"Il meetup '{{title}}' si sta tenendo a solo {{distance}}!", photo_found_title:"📸 Feed foto locale in diretta", photo_found_desc:"Una foto è stata appena pubblicata a solo {{distance}}!",
      profile:"Profilo", destination:"Destinazione", schedule:"Programma", travelStyle:"Stile di viaggio", reset:"Reimposta", viewProfile:"Visualizza profilo", locationNoAuth:"Autorizzazione posizione negata", locationUnknown:"Posizione sconosciuta", matchFail:"Match fallito", matchSuccess:"Match riuscito!", newVibe:"Nuovo raggio esplorato", filterApplied:"Filtro applicato.", user:"Utente", bioPlaceholder:"Nessuna descrizione.", destPlaceholder:"Destinazione sconosciuta", datesUnknown:"Date sconosciute", genderUnknown:"Sconosciuto", korean:"Coreano", seoul:"Seul", host:"Host", today:"Oggi", searchingPlaces:"Ricerca luoghi vicini...", connectingPlaces:"Connessione a Google Places", hostLabel:"Organizzatore", mapFilter:"Filtro mappa", distanceRadius:"Raggio di distanza", apply:"Applica", lightningMatchDesc:"Vai in un posto popolare e fai match automatico con 4~6 persone!", lightningMatchTitle:"Organizzazione gruppo di viaggio...", lightningMatchProgress1:"Invitando 3~5 membri casuali", lightningMatchProgress2:"in luoghi popolari 🚀", enterChat:"Entra nella chat", applyJoin:"Richiedi di unirti", locationShareOff:"Condivisione posizione disattivata", normal:"Normale", cancelLike:"Rimuovi like", like:"Mi piace", me:"Io", title:"Mappa", nearby:"Viaggiatori nelle vicinanze", noNearby:"Nessun viaggiatore nelle vicinanze", loading:"Caricamento mappa..."
    },
    match: {
      title:"Match", like:"Mi piace", pass:"Salta", superLike:"Super Like", matched:"È un Match!", startChat:"Inizia a chattare", keepSwiping:"Continua", noMore:"Hai visto tutti i viaggiatori nelle vicinanze!", filters:"Filtri", distance:"Distanza", age:"Età", filterGender:"Chi incontrare", filterDist:"Raggio di distanza", filterTitle:"Impostazioni filtro", filterReset:"Reimposta", empty:"Hai visto tutti i viaggiatori nelle vicinanze!", emptyDesc:"Nuovi viaggiatori appariranno presto", score:"Punteggio match", superLikesLeft:"Super Like {{count}} volte", refresh:"Rivedi", slTitle:"Super Like a {{name}}", slTodayLeft:"Ne restano {{count}} oggi", slMsgLabel:"Invia un messaggio", slMsgOptional:"(opzionale)", slMsgPlaceholder:"Vado anch'io a {{dest}}! Viaggiamo insieme? ✈️", slSend:"Invia Super Like", slCancel:"Annulla", slQ1:"Vado anch'io a {{dest}}! 🙌", slQ2:"Viaggiamo insieme! ✈️", slQ3:"Penso che abbiamo interessi simili 😊", slQ4:"Esploriamo ristoranti buoni insieme 🍜", limitReached:"Ho usato tutti i Super Like di oggi ⭐", limitReachedDesc:"Domani puoi usarne altri 3", toast:"Ho inviato un super like a {{name}}!", toastDesc:"Verrà inviata una notifica speciale", noLocation:"Posizione non impostata", filterDesc:"Configura i filtri di ricerca.", filterAge:"Impostazione fascia di età", filterAgePlus:"Filtro età", filterLang:"Lingua preferita", filterLangPlus:"Selezione multipla lingue", traveler:"Viaggiatore"
    },
    chat: {
      title:"Chat", searchPlaceholder:"Cerca conversazioni...", noChats:"Nessuna conversazione ancora", online:"Online", offline:"Offline", typing:"Sta scrivendo...", deleteChat:"Elimina conversazione", translateFail:"Traduzione fallita", sendFail:"Invio fallito", unknownLocation:"Posizione sconosciuta", locationPermErr:"Autorizzazione posizione negata", subtitle:"Chatta con i viaggiatori abbinati", search:"Cerca conversazioni...", noResult:"Nessun risultato", muted:"Notifiche disattivate", viewProfile:"Visualizza profilo", muteOn:"Disattiva notifiche 🔕", muteOff:"Attiva notifiche 🔔", report:"Segnala", locationShared:"📍 Ho condiviso la mia posizione!", locationPermReq:"Autorizzazione posizione necessaria", scheduleRequired:"Inserisci tutte le date e il programma", translateFailDesc:"Riprova", mutedOn:"Notifiche di {{name}} disattivate 🔕", mutedOff:"Notifiche di {{name}} attivate 🔔", reportTitle:"Segnala", reportDesc:"Dicci perché stai segnalando {{name}}", reportNeed:"Inserisci il motivo della segnalazione", reportDone:"Segnalazione ricevuta", reportDoneDesc:"Prenderemo provvedimenti dopo la revisione. Grazie.", deleteTitle:"Eliminare la conversazione?", deleteDesc:"Le conversazioni eliminate non possono essere recuperate", deleteConfirm:"Elimina", deleted:"Conversazione eliminata", locShared:"📍 Ho condiviso la posizione attuale", meetProposal:"Proposta di incontro", meetDate:"Data", meetPlace:"Luogo", meetPlaceholder:"Es: Ingresso di Khaosan Road", meetSend:"Invia proposta", meetDone:"Proposta di incontro inviata! 🎉", meetNeed:"Inserisci data e luogo", input:"Scrivi un messaggio...", inputMuted:"🔕 Conversazione con notifiche disattivate.", shareLocation:"Condividi posizione", cancel:"Annulla", reportReasons:["Parole o azioni inappropriate","Spam / Pubblicità","Profilo falso","Contenuto offensivo","Altro"], autoTranslate:"Traduzione auto ", translating:"Traduzione...", viewOriginal:"Visualizza originale", translate:"Traduci", translated:"Tradotto ", myCurrentLocation:"La mia posizione attuale", locationUnknown:"Posizione sconosciuta", openMap:"Apri mappa", ourSchedule:"Il nostro programma 🗺️", read:"Letto", dailyLimitTitle:"Limite messaggi giornaliero raggiunto", dailyLimitDesc:"Passa a Plus per messaggi illimitati 👑", lockedPlaceholder:"Abbonati a Plus per inviare messaggi", meetProposalBtn:"Proponi un incontro", scheduleShareBtn:"Condividi programma", scheduleShare:"Condividi programma", scheduleWhen:"Quando?", scheduleDatePlaceholder:"Es: 20 mag, ore 15", scheduleWhat:"Qual è il piano?", scheduleContentPlaceholder:"Es: Tour caffetterie poi cena insieme", safeCompanionTitle:"🛡️ Modalità Compagno Sicuro attiva!", safeCompanionDesc:"La tua situazione attuale viene condivisa con il tuo tutore e il centro sicurezza Migo.", safeCompanionBtn:"Modalità Compagno Sicuro", noShowReport:"Segnala assenza e abbandona chat", noShowReportDesc:"Segnalazione assenza inviata. Uscita dalla chatroom."
    },
    discover: {
      groups:"Gruppi di viaggio", community:"Comunità", all:"Tutto", recruiting:"Cercando membri", almostFull:"Quasi pieno", searchPlaceholder:"Cerca per destinazione, stile di viaggio...", hot:"Post popolari", title:"Esplora", write:"Scrivi un post", writeTitle:"Scrivi un post", writeTitlePlaceholder:"Inserisci un titolo", writeContentPlaceholder:"Consigli di viaggio, luoghi consigliati, cercando compagni...", writeTagPlaceholder:"Tag (es: Bangkok)", photoAdd:"Allega foto", photoChange:"Cambia foto", post:"Pubblica", postDone:"Post pubblicato! 🎉", postNeed:"Inserisci titolo e contenuto", deletePost:"Post eliminato", deleteGroup:"Gruppo di viaggio eliminato 🗑️", confirmDelete:"Eliminare questo post?", confirmDeleteGroup:"Eliminare questo gruppo di viaggio?", newPost:"Nuovo post pubblicato! 🔔", firstComment:"Sii il primo a commentare 💬", commentPlaceholder:"Inserisci un commento...", comments:"Commento {{count}}", clipCopied:"Copiato negli appunti! 📋", joinGroup:"Unisciti", joined:"Unito", full:"Gruppo pieno 😢", fullDesc:"Trovare un altro gruppo?", alreadyJoined:"Partecipi già a questo gruppo.", savedOk:"Salvato ✨", savedRemove:"Salvataggio annullato", delete:"Elimina", detailView:"Vedi dettagli"
    }
  },
  nl: {
    map: {
      distanceUnknown:"Afstand onbekend", traveler_found_title:"👥 Reiziger in de buurt ontdekt!", traveler_found_desc:"{{name}} is maar {{distance}} verwijderd (ca. {{time}} min lopen)!", hotplace_found_title:"{{emoji}} Dichtstbijzijnde {{category}}!", hotplace_found_desc:"Mensen verzamelen zich bij '{{name}}' — {{distance}} verwijderd (ca. {{time}} min lopen)!", group_found_title:"🍻 Meetup in de buurt aan de gang", group_found_desc:"Meetup '{{title}}' vindt slechts {{distance}} verwijderd plaats!", photo_found_title:"📸 Live lokale fotofeed", photo_found_desc:"Er is zojuist een foto geplaatst op slechts {{distance}}!",
      profile:"Profiel", destination:"Bestemming", schedule:"Schema", travelStyle:"Reisstijl", reset:"Resetten", viewProfile:"Profiel bekijken", locationNoAuth:"Locatiemachtiging geweigerd", locationUnknown:"Locatie onbekend", matchFail:"Match mislukt", matchSuccess:"Match gelukt!", newVibe:"Nieuwe straal verkend", filterApplied:"Filter toegepast.", user:"Gebruiker", bioPlaceholder:"Geen beschrijving.", destPlaceholder:"Bestemming onbekend", datesUnknown:"Datums onbekend", genderUnknown:"Onbekend", korean:"Koreaans", seoul:"Seoul", host:"Gastheer", today:"Vandaag", searchingPlaces:"Zoeken naar plekken in de buurt...", connectingPlaces:"Verbinden met Google Places", hostLabel:"Organisator", mapFilter:"Kaartfilter", distanceRadius:"Afstandsstraal", apply:"Toepassen", lightningMatchDesc:"Ga naar een populaire plek en match automatisch met 4~6 mensen!", lightningMatchTitle:"Reisgroep organiseren...", lightningMatchProgress1:"3~5 willekeurige leden uitnodigen", lightningMatchProgress2:"op populaire plekken 🚀", enterChat:"Chat betreden", applyJoin:"Deelname aanvragen", locationShareOff:"Locatiedeling uit", normal:"Normaal", cancelLike:"Like verwijderen", like:"Leuk", me:"Ik", title:"Kaart", nearby:"Reizigers in de buurt", noNearby:"Geen reizigers in de buurt", loading:"Kaart laden..."
    },
    match: {
      title:"Match", like:"Leuk", pass:"Overslaan", superLike:"Super Like", matched:"Het is een Match!", startChat:"Begin met chatten", keepSwiping:"Doorgaan", noMore:"Je hebt alle reizigers in de buurt gezien!", filters:"Filters", distance:"Afstand", age:"Leeftijd", filterGender:"Wie ontmoeten", filterDist:"Afstandsstraal", filterTitle:"Filterinstellingen", filterReset:"Resetten", empty:"Je hebt alle reizigers in de buurt gezien!", emptyDesc:"Nieuwe reizigers verschijnen binnenkort", score:"Matchscore", superLikesLeft:"Super Like {{count}} keer", refresh:"Opnieuw bekijken", slTitle:"Super Like aan {{name}}", slTodayLeft:"Er zijn vandaag nog {{count}} over", slMsgLabel:"Bericht sturen", slMsgOptional:"(optioneel)", slMsgPlaceholder:"Ik ga ook naar {{dest}}! Samen reizen? ✈️", slSend:"Super Like sturen", slCancel:"Annuleren", slQ1:"Ik ga ook naar {{dest}}! 🙌", slQ2:"Laten we samen reizen! ✈️", slQ3:"Ik denk dat we vergelijkbare interesses hebben 😊", slQ4:"Laten we samen goede restaurants ontdekken 🍜", limitReached:"Alle Super Likes van vandaag gebruikt ⭐", limitReachedDesc:"Morgen weer 3 beschikbaar", toast:"Super Like gestuurd naar {{name}}!", toastDesc:"Er wordt een speciale melding verstuurd", noLocation:"Locatie niet ingesteld", filterDesc:"Zoekfilters instellen.", filterAge:"Leeftijdsbereik instellen", filterAgePlus:"Leeftijdsfilter", filterLang:"Voorkeurstaal", filterLangPlus:"Meerdere talen selecteren", traveler:"Reiziger"
    },
    chat: {
      title:"Chats", searchPlaceholder:"Gesprekken zoeken...", noChats:"Nog geen gesprekken", online:"Online", offline:"Offline", typing:"Aan het typen...", deleteChat:"Gesprek verwijderen", translateFail:"Vertaling mislukt", sendFail:"Verzenden mislukt", unknownLocation:"Onbekende locatie", locationPermErr:"Locatiemachtiging geweigerd", subtitle:"Chat met gematchte reizigers", search:"Gesprekken zoeken...", noResult:"Geen resultaten gevonden", muted:"Meldingen uit", viewProfile:"Profiel bekijken", muteOn:"Meldingen uitschakelen 🔕", muteOff:"Meldingen inschakelen 🔔", report:"Melden", locationShared:"📍 Mijn locatie gedeeld!", locationPermReq:"Locatiemachtiging vereist", scheduleRequired:"Voer alle datums en het schema in", translateFailDesc:"Probeer opnieuw", mutedOn:"Meldingen van {{name}} uitgeschakeld 🔕", mutedOff:"Meldingen van {{name}} ingeschakeld 🔔", reportTitle:"Melden", reportDesc:"Vertel ons waarom je {{name}} meldt", reportNeed:"Voer de reden voor de melding in", reportDone:"Melding ontvangen", reportDoneDesc:"We ondernemen actie na beoordeling. Bedankt.", deleteTitle:"Gesprek verwijderen?", deleteDesc:"Verwijderde gesprekken kunnen niet worden hersteld", deleteConfirm:"Verwijderen", deleted:"Gesprek verwijderd", locShared:"📍 Huidige locatie gedeeld", meetProposal:"Ontmoetingsvoorstel", meetDate:"Datum", meetPlace:"Locatie", meetPlaceholder:"Bijv: Ingang Khaosan Road", meetSend:"Voorstel sturen", meetDone:"Ontmoetingsvoorstel verstuurd! 🎉", meetNeed:"Voer datum en locatie in", input:"Bericht invoeren...", inputMuted:"🔕 Gesprek met meldingen uitgeschakeld.", shareLocation:"Locatie delen", cancel:"Annuleren", reportReasons:["Ongepaste woorden of acties","Spam / Reclame","Nepprofield","Aanstootgevende inhoud","Overig"], autoTranslate:"Automatisch vertalen ", translating:"Vertalen...", viewOriginal:"Origineel bekijken", translate:"Vertalen", translated:"Vertaald ", myCurrentLocation:"Mijn huidige locatie", locationUnknown:"Locatie onbekend", openMap:"Kaart openen", ourSchedule:"Ons schema 🗺️", read:"Gelezen", dailyLimitTitle:"Dagelijks berichtlimiet bereikt", dailyLimitDesc:"Upgrade naar Plus voor onbeperkte berichten 👑", lockedPlaceholder:"Abonneer op Plus om berichten te sturen", meetProposalBtn:"Ontmoeting voorstellen", scheduleShareBtn:"Schema delen", scheduleShare:"Schema delen", scheduleWhen:"Wanneer?", scheduleDatePlaceholder:"Bijv: 20 mei, 15:00", scheduleWhat:"Wat is het plan?", scheduleContentPlaceholder:"Bijv: Cafés bezoeken dan samen dineren", safeCompanionTitle:"🛡️ Veilige gezelsmodus actief!", safeCompanionDesc:"Je huidige situatie wordt gedeeld met je voogd en het Migo-veiligheidscentrum.", safeCompanionBtn:"Veilige gezelsmodus", noShowReport:"Afwezigheid melden & chat verlaten", noShowReportDesc:"Afwezigheidsmelding ingediend. Chat verlaten."
    },
    discover: {
      groups:"Reisgroepen", community:"Gemeenschap", all:"Alles", recruiting:"Zoekt leden", almostFull:"Bijna vol", searchPlaceholder:"Zoeken op bestemming, reisstijl...", hot:"Populaire berichten", title:"Ontdekken", write:"Bericht schrijven", writeTitle:"Bericht schrijven", writeTitlePlaceholder:"Voer een titel in", writeContentPlaceholder:"Reistips, aanbevolen plekken, reisgezel gezocht...", writeTagPlaceholder:"Tags (bijv: Bangkok)", photoAdd:"Foto toevoegen", photoChange:"Foto wijzigen", post:"Plaatsen", postDone:"Bericht geplaatst! 🎉", postNeed:"Voer titel en inhoud in", deletePost:"Bericht verwijderd", deleteGroup:"Reisgroep verwijderd 🗑️", confirmDelete:"Dit bericht verwijderen?", confirmDeleteGroup:"Deze reisgroep verwijderen?", newPost:"Nieuw bericht geplaatst! 🔔", firstComment:"Wees de eerste om te reageren 💬", commentPlaceholder:"Reactie invoeren...", comments:"Reactie {{count}}", clipCopied:"Gekopieerd naar klembord! 📋", joinGroup:"Deelnemen", joined:"Deelnemend", full:"Groep is vol 😢", fullDesc:"Andere groep zoeken?", alreadyJoined:"Je neemt al deel aan deze groep.", savedOk:"Opgeslagen ✨", savedRemove:"Opslaan geannuleerd", delete:"Verwijderen", detailView:"Details bekijken"
    }
  }
};

let count = 0;
for (const [lang, sections] of Object.entries(DATA)) {
  const fp = path.join(LOCALES, `${lang}.ts`);
  if (!fs.existsSync(fp)) { console.log(`SKIP ${lang}`); continue; }
  let content = fs.readFileSync(fp, 'utf8');
  let changed = false;
  const builders = { map: buildMap, match: buildMatch, chat: buildChat, discover: buildDiscover };
  for (const [sec, builder] of Object.entries(builders)) {
    const { start, end } = MARKERS[sec];
    const si = content.indexOf(start);
    const ei = content.indexOf(end, si);
    if (si === -1 || ei === -1) { console.log(`  ${lang}/${sec}: skip`); continue; }
    content = content.slice(0, si) + builder(sections[sec]) + content.slice(ei + end.length);
    changed = true;
    console.log(`  ✓ ${lang}/${sec}`);
  }
  if (changed) { fs.writeFileSync(fp, content, 'utf8'); count++; console.log(`[DONE] ${lang}.ts`); }
}
console.log(`\nDone. ${count} file(s) updated.`);
