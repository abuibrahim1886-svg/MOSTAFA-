const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');

// I need to properly restore the useEffect cleanup, and place the join handler functions after the useEffect.
content = content.replace(
  `    window.addEventListener('hashchange', handleUrlChange);  
  const handleRequestJoin = useCallback((tNum: number, deviceId: string, customerName: string) => {`,
  `    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleRequestJoin = useCallback((tNum: number, deviceId: string, customerName: string) => {`
);

content = content.replace(
  `  const handleRejectJoin = useCallback((tNum: number, deviceId: string) => {
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

  return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);`,
  `  const handleRejectJoin = useCallback((tNum: number, deviceId: string) => {
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
  }, [setTables]);`
);

fs.writeFileSync('./src/App.tsx', content);
