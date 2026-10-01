const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');

const joinLogic = `
  const handleRequestJoin = useCallback((tNum: number, deviceId: string, customerName: string) => {
    setTables(prev => prev.map(t => {
      if (t.tableNumber === tNum) {
        const joinReqs = t.joinRequests || [];
        if (!joinReqs.find(r => r.deviceId === deviceId)) {
          return {
            ...t,
            joinRequests: [...joinReqs, { deviceId, customerName, requestedAt: new Date().toISOString() }]
          };
        }
      }
      return t;
    }));
  }, [setTables]);

  const handleApproveJoin = useCallback((tNum: number, deviceId: string) => {
    setTables(prev => prev.map(t => {
      if (t.tableNumber === tNum) {
        const joinReqs = t.joinRequests || [];
        const approvedDevs = t.approvedDevices || [];
        return {
          ...t,
          joinRequests: joinReqs.filter(r => r.deviceId !== deviceId),
          approvedDevices: [...new Set([...approvedDevs, deviceId])]
        };
      }
      return t;
    }));
  }, [setTables]);

  const handleRejectJoin = useCallback((tNum: number, deviceId: string) => {
    setTables(prev => prev.map(t => {
      if (t.tableNumber === tNum) {
        const joinReqs = t.joinRequests || [];
        return {
          ...t,
          joinRequests: joinReqs.filter(r => r.deviceId !== deviceId)
        };
      }
      return t;
    }));
  }, [setTables]);

  return (
`;

content = content.replace('  return (', joinLogic);

content = content.replace(
  '          onReleaseSession={handleReleaseTableSession}',
  `          onReleaseSession={handleReleaseTableSession}\n          onRequestJoin={handleRequestJoin}\n          onApproveJoin={handleApproveJoin}\n          onRejectJoin={handleRejectJoin}`
);

fs.writeFileSync('./src/App.tsx', content);
