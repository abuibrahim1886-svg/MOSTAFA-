const fs = require('fs');
let content = fs.readFileSync('./src/components/ClientMenu.tsx', 'utf8');

const approveUI = `
      {/* Primary User: Join Requests Notification */}
      {isPrimaryDevice && othersPendingJoin.length > 0 && (
        <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2">
          {othersPendingJoin.map(req => (
            <div key={req.deviceId} className="bg-white rounded-2xl shadow-xl border border-[#D4A373]/30 p-4 flex items-center justify-between animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-stone-800">{req.customerName || 'مستخدم'}</p>
                  <p className="text-[10px] text-stone-500 font-bold">يطلب الانضمام إلى طاولتك</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onApproveJoin?.(currentTableNum, req.deviceId)}
                  className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-colors"
                >
                  <Check size={16} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => onRejectJoin?.(currentTableNum, req.deviceId)}
                  className="w-8 h-8 flex items-center justify-center bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200 transition-colors"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
`;

content = content.replace('{showSplash && settings.splashScreenEnabled !== false && (', approveUI + '\n      {showSplash && settings.splashScreenEnabled !== false && (');

// And I need to import UserPlus in ClientMenu
if (!content.includes('UserPlus')) {
  content = content.replace('User,', 'User, UserPlus,');
}

fs.writeFileSync('./src/components/ClientMenu.tsx', content);
