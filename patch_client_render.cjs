const fs = require('fs');
let content = fs.readFileSync('./src/components/ClientMenu.tsx', 'utf8');

const replacement = `
  if (isSessionLockedByOther && !isBrowsingOnly) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center" style={{ direction: 'rtl' }}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={36} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black text-stone-800 mb-2">طاولة رقم {currentTableNum} محجوزة</h2>
          <p className="text-xs text-stone-500 mb-8 leading-relaxed font-bold">
            هذه الطاولة قيد الاستخدام حالياً من قبل شخص آخر. لمنع تداخل الطلبات، تم إغلاق الطلب منها.
          </p>
          
          {pendingJoinRequest ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <Clock className="mx-auto text-amber-500 mb-2 animate-pulse" size={24} />
              <p className="text-sm font-black text-amber-800">جاري انتظار موافقة الجالس على الطاولة...</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <input 
                type="text" 
                placeholder="أدخل اسمك لطلب الانضمام للطاولة..."
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#3D271D]"
              />
              <button 
                onClick={() => {
                  if(!joinName.trim()) return alert('الرجاء كتابة اسمك');
                  onRequestJoin?.(currentTableNum, deviceId, joinName.trim());
                }}
                className="w-full bg-[#3D271D] text-white py-3.5 rounded-2xl font-black text-sm hover:bg-[#2A1D15] transition-all shadow-lg active:scale-95"
              >
                طلب الانضمام للطاولة
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsBrowsingOnly(true)}
            className="w-full bg-stone-100 text-stone-700 py-3.5 rounded-2xl font-black text-sm hover:bg-stone-200 transition-all mb-4"
          >
            تصفح المنيو فقط
          </button>
          
          {!isTableFixed && (
            <button 
              onClick={() => setShowTableChangeModal(true)}
              className="text-stone-500 font-bold text-xs underline underline-offset-4"
            >
              أو اختر طاولة أخرى متاحة
            </button>
          )}
        </div>
        
        {/* Render Table change modal silently here so user can switch */}
        {showTableChangeModal && !isTableFixed && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
               <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                 <h3 className="font-black text-lg text-stone-800">تغيير الطاولة</h3>
                 <button onClick={() => setShowTableChangeModal(false)} className="w-8 h-8 flex items-center justify-center bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-colors">
                   <X size={18} />
                 </button>
               </div>
               <div className="p-5 max-h-[60vh] overflow-y-auto">
                 <div className="grid grid-cols-3 gap-3">
                   {tables.map(t => {
                     const isBusy = t.status === 'busy' || t.status === 'bill_requested';
                     return (
                       <button
                         key={t.tableNumber}
                         onClick={() => {
                           onTableChange(t.tableNumber);
                           setIsBrowsingOnly(false);
                           setShowTableChangeModal(false);
                         }}
                         className={\`p-3 rounded-2xl border text-center font-bold text-xs transition-all \${
                           isBusy
                             ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                             : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                         }\`}
                       >
                         <div className="text-sm font-black">طاولة {t.tableNumber}</div>
                       </button>
                     );
                   })}
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
`;

content = content.replace('  return (', replacement);

fs.writeFileSync('./src/components/ClientMenu.tsx', content);
