const fs = require('fs');
let content = fs.readFileSync('./src/components/ClientMenu.tsx', 'utf8');

// Add props
content = content.replace(
  'onReleaseSession?: (tableNumber: number) => void;',
  `onReleaseSession?: (tableNumber: number) => void;
  onRequestJoin?: (tableNumber: number, deviceId: string, customerName: string) => void;
  onApproveJoin?: (tableNumber: number, deviceId: string) => void;
  onRejectJoin?: (tableNumber: number, deviceId: string) => void;`
);

content = content.replace(
  'onReleaseSession,',
  'onReleaseSession,\n  onRequestJoin,\n  onApproveJoin,\n  onRejectJoin,'
);

// Modify isSessionLockedByOther
const lockLogic = `
  const isSessionLockedByOther = Boolean(
    settings.singleActiveSessionEnabled !== false &&
    currentTableInfo?.activeSessionDeviceId &&
    currentTableInfo.activeSessionDeviceId !== deviceId &&
    !(currentTableInfo.approvedDevices || []).includes(deviceId) &&
    (settings.lockOnFirstOrderOnly !== false
      ? (activeTableOrders.length > 0 || currentTableInfo.status === 'busy' || currentTableInfo.status === 'bill_requested')
      : true
    )
  );

  const pendingJoinRequest = (currentTableInfo?.joinRequests || []).find(r => r.deviceId === deviceId);
  const othersPendingJoin = (currentTableInfo?.joinRequests || []).filter(r => r.deviceId !== deviceId);
  const isPrimaryDevice = currentTableInfo?.activeSessionDeviceId === deviceId;
  const [joinName, setJoinName] = useState(customerName || '');
`;

content = content.replace(/const isSessionLockedByOther = Boolean\([\s\S]*?\);/, lockLogic);

fs.writeFileSync('./src/components/ClientMenu.tsx', content);
