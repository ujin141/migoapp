const fs = require('fs');
const path = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/ChatPage.tsx';
let txt = fs.readFileSync(path, 'utf8');

txt = txt.replace(
  '    useDm\r\n  } = useSubscription();',
  '    useDm,\r\n    canReadReceipts\r\n  } = useSubscription();'
);
txt = txt.replace(
  '    useDm\n  } = useSubscription();',
  '    useDm,\n    canReadReceipts\n  } = useSubscription();'
);

const target2_r = '{isMe && <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isLastMine ? "text-primary-foreground/50" : "text-blue-300"}`}>\r\n                        <Check size={9} strokeWidth={3} />\r\n                        <Check size={9} strokeWidth={3} className="-ml-1.5" />\r\n                        {!isLastMine && <span className="text-[8px]">{i18n.t(i18n.t("auto.z_autoz\\uC77D\\uC74C499_902"))}</span>}\r\n                      </span>}';
const replace2_r = '{isMe && canReadReceipts && <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isLastMine ? "text-primary-foreground/50" : "text-blue-300"}`}>\r\n                        <Check size={9} strokeWidth={3} />\r\n                        <Check size={9} strokeWidth={3} className="-ml-1.5" />\r\n                        {!isLastMine && <span className="text-[8px]">{i18n.t(i18n.t("auto.z_autoz\\uC77D\\uC74C499_902"))}</span>}\r\n                      </span>}';

const target2_n = target2_r.replace(/\r\n/g, '\n');
const replace2_n = replace2_r.replace(/\r\n/g, '\n');

txt = txt.replace(target2_r, replace2_r);
txt = txt.replace(target2_n, replace2_n);

fs.writeFileSync(path, txt);
console.log('Done');
