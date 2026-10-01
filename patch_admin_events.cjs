const fs = require('fs');
let content = fs.readFileSync('./src/components/AdminDashboard.tsx', 'utf8');

// The UI code I injected used CustomEvents:
// <button onClick={() => window.dispatchEvent(new CustomEvent('approve-join', {detail: {tNum: table.tableNumber, dId: req.deviceId}}))}
// I can just replace them with direct setTables calls.

content = content.replace(
  /window\.dispatchEvent\(new CustomEvent\('approve-join', \{detail: \{tNum: table\.tableNumber, dId: req\.deviceId\}\}\)\)/g,
  `setTables(prev => prev.map(t => {
                                    if (t.tableNumber === table.tableNumber) {
                                      const joinReqs = t.joinRequests || [];
                                      const approvedDevs = t.approvedDevices || [];
                                      return {
                                        ...t,
                                        joinRequests: joinReqs.filter(r => r.deviceId !== req.deviceId),
                                        approvedDevices: [...new Set([...approvedDevs, req.deviceId])]
                                      };
                                    }
                                    return t;
                                  }))`
);

content = content.replace(
  /window\.dispatchEvent\(new CustomEvent\('reject-join', \{detail: \{tNum: table\.tableNumber, dId: req\.deviceId\}\}\)\)/g,
  `setTables(prev => prev.map(t => {
                                    if (t.tableNumber === table.tableNumber) {
                                      const joinReqs = t.joinRequests || [];
                                      return {
                                        ...t,
                                        joinRequests: joinReqs.filter(r => r.deviceId !== req.deviceId)
                                      };
                                    }
                                    return t;
                                  }))`
);

fs.writeFileSync('./src/components/AdminDashboard.tsx', content);
