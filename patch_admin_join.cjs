const fs = require('fs');
let content = fs.readFileSync('./src/components/AdminDashboard.tsx', 'utf8');

const tableLoopStart = content.indexOf('return (', content.indexOf('const durationInfo = getSittingDurationInfo(table);'));

const joinReqsUI = `
                      {/* Join Requests Indicator */}
                      {table.joinRequests && table.joinRequests.length > 0 && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                          <p className="text-[10px] font-black text-amber-800 mb-2 flex items-center gap-1">
                            <UserPlus size={12} />
                            طلبات الانضمام ({table.joinRequests.length})
                          </p>
                          <div className="space-y-1">
                            {table.joinRequests.map(req => (
                              <div key={req.deviceId} className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-amber-100 text-[10px]">
                                <span className="font-bold text-stone-700 truncate max-w-[80px]">{req.customerName || 'مستخدم'}</span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => window.dispatchEvent(new CustomEvent('approve-join', {detail: {tNum: table.tableNumber, dId: req.deviceId}}))} className="text-emerald-600 bg-emerald-50 w-6 h-6 rounded-md flex items-center justify-center hover:bg-emerald-100"><Check size={12}/></button>
                                  <button onClick={() => window.dispatchEvent(new CustomEvent('reject-join', {detail: {tNum: table.tableNumber, dId: req.deviceId}}))} className="text-rose-600 bg-rose-50 w-6 h-6 rounded-md flex items-center justify-center hover:bg-rose-100"><X size={12}/></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
`;

content = content.replace(
  '                      {/* Live Timer if Busy */}',
  joinReqsUI + '\n                      {/* Live Timer if Busy */}'
);

if (!content.includes('UserPlus')) {
  content = content.replace('User,', 'User, UserPlus,');
}

fs.writeFileSync('./src/components/AdminDashboard.tsx', content);
