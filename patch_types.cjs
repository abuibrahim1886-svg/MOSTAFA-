const fs = require('fs');
let content = fs.readFileSync('./src/types.ts', 'utf8');

const tableJoinReq = `
export interface TableJoinRequest {
  deviceId: string;
  customerName: string;
  requestedAt: string;
}
`;

content = content.replace('export interface TableInfo {', tableJoinReq + '\nexport interface TableInfo {\n  approvedDevices?: string[];\n  joinRequests?: TableJoinRequest[];');

fs.writeFileSync('./src/types.ts', content);
