import { useState, useEffect, useCallback, useRef } from 'react';
import { Order, OrderStatus, BillRequest, MenuItem } from '../types';
import { syncHub } from './syncHub';
import { normalizeOrder, normalizeOrders } from '../utils/orderUtils';
import { orderSyncWorker } from './orderSyncWorkerClient';

const ORDERS_STORAGE_KEY = 'smart_menu_orders_vault_v1';
const DELETED_ORDERS_KEY = 'smart_menu_deleted_order_ids_v1';
const VAULT_INSTANCE_ID = `vault_${Math.random().toString(36).substring(2, 9)}`;
const BILLS_STORAGE_KEY = 'smart_menu_bills_vault_v1';
const BILLS_BROADCAST_CHANNEL = 'smart_menu_bills_channel_v1';

export function useOrdersVault(fallbackMenuItems?: MenuItem[]) {
  // 1. Initialize Deleted Order IDs Set
  const [deletedOrderIds, setDeletedOrderIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(DELETED_ORDERS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return new Set(parsed);
        }
      } catch (e) {}
    }
    return new Set<string>();
  });

  const deletedIdsRef = useRef<Set<string>>(deletedOrderIds);
  useEffect(() => {
    deletedIdsRef.current = deletedOrderIds;
  }, [deletedOrderIds]);

  // 2. Initialize Orders State with offline-first local cache for instant rendering
  const [orders, setOrdersState] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).__INITIAL_DATA__?.orders && Array.isArray((window as any).__INITIAL_DATA__.orders)) {
        return normalizeOrders((window as any).__INITIAL_DATA__.orders, fallbackMenuItems);
      }
      try {
        const cached = localStorage.getItem(ORDERS_STORAGE_KEY) || localStorage.getItem('smart_menu_sync_orders');
        if (cached) {
          const parsed = JSON.parse(cached);
          const raw = parsed && parsed.data !== undefined ? parsed.data : parsed;
          if (Array.isArray(raw)) {
            return normalizeOrders(raw, fallbackMenuItems);
          }
        }
      } catch (e) {}
    }
    return [];
  });

  const ordersRef = useRef<Order[]>(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // 3. Initialize Bill Requests State from LocalStorage Vault
  const [billRequests, setBillRequestsState] = useState<BillRequest[]>(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).__INITIAL_DATA__?.bill_requests && Array.isArray((window as any).__INITIAL_DATA__.bill_requests)) {
        return (window as any).__INITIAL_DATA__.bill_requests.filter((b: any) => Number(b.tableNumber) !== 0);
      }
      try {
        const cachedVault = localStorage.getItem(BILLS_STORAGE_KEY);
        if (cachedVault) {
          const parsed = JSON.parse(cachedVault);
          if (Array.isArray(parsed)) {
            return parsed.filter((b: any) => Number(b.tableNumber) !== 0);
          }
        }
      } catch (e) {}
    }
    return [];
  });

  const billRequestsRef = useRef<BillRequest[]>(billRequests);
  useEffect(() => {
    billRequestsRef.current = billRequests;
  }, [billRequests]);

  const lastOrdersWriteTimeRef = useRef<number>(0);
  const lastBillsWriteTimeRef = useRef<number>(0);
  const ordersSyncDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const ordersChannelRef = useRef<BroadcastChannel | null>(null);
  const billsChannelRef = useRef<BroadcastChannel | null>(null);

  // Synchronous persistence helper for bills only
  const persistBillsLocally = useCallback((newBills: BillRequest[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(newBills));
        localStorage.setItem('smart_menu_sync_bill_requests', JSON.stringify({ data: newBills, senderId: VAULT_INSTANCE_ID, t: Date.now() }));
      } catch (e) {}
    }
  }, []);

  // Instant persistence helper for orders (0ms)
  const persistOrdersLocally = useCallback((newOrders: Order[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(newOrders));
        localStorage.setItem('smart_menu_sync_orders', JSON.stringify({ data: newOrders, senderId: VAULT_INSTANCE_ID, t: Date.now() }));
      } catch (e) {}
    }
  }, []);

  // Server-authoritative merge for incoming orders
  const mergeIncomingOrders = useCallback((incomingRaw: any[], meta?: { senderId?: string }) => {
    if (!Array.isArray(incomingRaw)) return;
    if (meta && meta.senderId === VAULT_INSTANCE_ID) return;

    if (incomingRaw.length === 0) {
      if (ordersRef.current.length > 0) {
        ordersRef.current = [];
        setOrdersState([]);
        try {
          localStorage.removeItem(ORDERS_STORAGE_KEY);
          localStorage.setItem('smart_menu_sync_orders', JSON.stringify({ data: [], senderId: VAULT_INSTANCE_ID, t: Date.now() }));
        } catch (e) {}
      }
      return;
    }

    const normalizedIncoming = normalizeOrders(incomingRaw, fallbackMenuItems);
    const currentOrders = ordersRef.current;
    const deletedIds = deletedIdsRef.current;

    // Start with server's authoritative map (Server is single source of truth)
    const serverMap = new Map<string, Order>();
    for (const inOrd of normalizedIncoming) {
      if (!inOrd || !inOrd.id) continue;
      serverMap.set(String(inOrd.id), inOrd);
    }

    // Keep all local active/pending orders if not yet reflected on server
    for (const ord of currentOrders) {
      if (!ord || !ord.id || deletedIds.has(ord.id)) continue;
      const key = String(ord.id);
      if (!serverMap.has(key) && (ord.status === 'pending' || ord.status === 'preparing')) {
        serverMap.set(key, ord);
      }
    }

    const mergedList = Array.from(serverMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || (a as any).timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || (b as any).timestamp || 0).getTime();
      return timeB - timeA;
    });

    // Fast, accurate comparison to detect any change in order properties or order list
    const hasDiff = JSON.stringify(mergedList) !== JSON.stringify(currentOrders);

    if (hasDiff) {
      ordersRef.current = mergedList;
      setOrdersState(mergedList);
      persistOrdersLocally(mergedList);
    }
  }, [fallbackMenuItems, persistOrdersLocally]);

  // Server-authoritative merge for incoming bill requests
  const mergeIncomingBills = useCallback((incomingRaw: any[], meta?: { senderId?: string }) => {
    if (!Array.isArray(incomingRaw)) return;
    if (meta && meta.senderId === VAULT_INSTANCE_ID) return;

    if (incomingRaw.length === 0) {
      // Preserve local pending bills
      const pendingLocal = billRequestsRef.current.filter(b => b && b.status === 'pending');
      if (pendingLocal.length > 0) return;

      if (billRequestsRef.current.length > 0) {
        billRequestsRef.current = [];
        setBillRequestsState([]);
        persistBillsLocally([]);
      }
      return;
    }

    const currentBills = billRequestsRef.current;
    const serverMap = new Map<string, BillRequest>();

    for (const inB of incomingRaw) {
      if (!inB || !inB.id || Number(inB.tableNumber) === 0) continue;
      const key = String(inB.id);
      const local = currentBills.find(cb => String(cb.id) === key);
      if (local && local.status === 'settled' && inB.status !== 'settled') {
        serverMap.set(key, { ...inB, status: 'settled', settledAt: local.settledAt || new Date().toISOString() });
      } else {
        serverMap.set(key, inB);
      }
    }

    // Preserve all local bills
    for (const b of currentBills) {
      if (!b || !b.id || Number(b.tableNumber) === 0) continue;
      const key = String(b.id);
      if (!serverMap.has(key)) {
        serverMap.set(key, b);
      }
    }

    const mergedList = Array.from(serverMap.values()).sort((a, b) => {
      const timeA = new Date(a.requestedAt || 0).getTime();
      const timeB = new Date(b.requestedAt || 0).getTime();
      return timeB - timeA;
    });

    const hasDiff = JSON.stringify(mergedList) !== JSON.stringify(currentBills);

    if (hasDiff) {
      billRequestsRef.current = mergedList;
      setBillRequestsState(mergedList);
      persistBillsLocally(mergedList);
    }
  }, [persistBillsLocally]);

  // Real-time synchronization setup
  useEffect(() => {
    // 1. Local BroadcastChannels
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const ordChan = new BroadcastChannel('smart_menu_orders_vault_channel');
        ordersChannelRef.current = ordChan;
        ordChan.onmessage = (event) => {
          if (event.data && event.data.senderId !== VAULT_INSTANCE_ID && Array.isArray(event.data.data)) {
            mergeIncomingOrders(event.data.data, { senderId: event.data.senderId });
          }
        };

        const billChan = new BroadcastChannel(BILLS_BROADCAST_CHANNEL);
        billsChannelRef.current = billChan;
        billChan.onmessage = (event) => {
          if (event.data && event.data.senderId !== VAULT_INSTANCE_ID && Array.isArray(event.data.data)) {
            mergeIncomingBills(event.data.data, { senderId: event.data.senderId });
          }
        };
      }
    } catch (e) {}

    // 2. Storage event listener (Cross-window & Cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === ORDERS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            mergeIncomingOrders(parsed, { senderId: 'storage' });
          }
        } catch (err) {}
      } else if (e.key === BILLS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            mergeIncomingBills(parsed, { senderId: 'storage' });
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Initial Server Hydration for Orders via unified bootstrap
    const fetchInitialData = async () => {
      try {
        const bootStore = await syncHub.fetchBootstrap();
        if (bootStore) {
          const rawOrders = bootStore["orders"];
          const serverOrders = (rawOrders && rawOrders.data) ? rawOrders.data : (Array.isArray(rawOrders) ? rawOrders : []);
          if (Array.isArray(serverOrders) && serverOrders.length > 0) {
            mergeIncomingOrders(serverOrders, { senderId: 'server-init' });
          }

          const rawBills = bootStore["bill_requests"];
          const serverBills = (rawBills && rawBills.data) ? rawBills.data : (Array.isArray(rawBills) ? rawBills : []);
          if (Array.isArray(serverBills) && serverBills.length > 0) {
            mergeIncomingBills(serverBills, { senderId: 'server-init' });
          }
          return;
        }

        // Fallback to separate endpoints only if bootstrap fails
        const [ordersRes, billsRes] = await Promise.allSettled([
          fetch('/api/orders'),
          fetch('/api/bills')
        ]);

        if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
          const serverOrders = await ordersRes.value.json();
          if (Array.isArray(serverOrders)) {
            mergeIncomingOrders(serverOrders, { senderId: 'server-init' });
          }
        }

        if (billsRes.status === 'fulfilled' && billsRes.value.ok) {
          const serverBills = await billsRes.value.json();
          if (Array.isArray(serverBills)) {
            mergeIncomingBills(serverBills, { senderId: 'server-init' });
          }
        }
      } catch (err) {
        console.warn('[OrdersVault] Initial server fetch warning:', err);
      }
    };

    fetchInitialData();

    // 4. SSE / Socket Subscriptions
    const unsubOrdersSSE = syncHub.subscribe('orders', (data, meta) => {
      if (Array.isArray(data)) {
        mergeIncomingOrders(data, meta);
      }
    });

    const unsubBillsSSE = syncHub.subscribe('bill_requests', (data, meta) => {
      if (Array.isArray(data)) {
        mergeIncomingBills(data, meta);
      }
    });

    // 5. Web Worker Subscriptions (public/order-sync.worker.ts background task running as safety sync)
    const unsubWorkerOrders = orderSyncWorker.onOrdersSync((event) => {
      if (Array.isArray(event.orders)) {
        mergeIncomingOrders(event.orders, { senderId: event.source || 'worker' });
      }
    });

    const unsubWorkerBills = orderSyncWorker.onBillsSync((event) => {
      if (Array.isArray(event.bills)) {
        mergeIncomingBills(event.bills, { senderId: event.source || 'worker' });
      }
    });

    return () => {
      unsubWorkerOrders();
      unsubWorkerBills();
      unsubOrdersSSE();
      unsubBillsSSE();
      if (ordersChannelRef.current) {
        ordersChannelRef.current.close();
        ordersChannelRef.current = null;
      }
      if (billsChannelRef.current) {
        billsChannelRef.current.close();
        billsChannelRef.current = null;
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, [mergeIncomingOrders, mergeIncomingBills]);

  // Set / Update Orders Mutation
  const setOrders = useCallback((updater: Order[] | ((prev: Order[]) => Order[])) => {
    let nextList: Order[];
    if (typeof updater === 'function') {
      nextList = updater(ordersRef.current);
    } else {
      nextList = updater;
    }

    const normalized = normalizeOrders(nextList, fallbackMenuItems);
    if (JSON.stringify(normalized) === JSON.stringify(ordersRef.current)) {
      return;
    }

    lastOrdersWriteTimeRef.current = Date.now();
    ordersRef.current = normalized;
    setOrdersState(normalized);
    persistOrdersLocally(normalized);

    // Broadcast 1: BroadcastChannel (0ms)
    try {
      if (ordersChannelRef.current) {
        ordersChannelRef.current.postMessage({ data: normalized, senderId: VAULT_INSTANCE_ID });
      }
    } catch (e) {}

    // Broadcast 2: Realtime WebSocket (0ms)
    syncHub.emitSyncWrite('orders', normalized, VAULT_INSTANCE_ID);

    // Broadcast 3: Express Server API
    fetch('/api/sync/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: normalized, senderId: VAULT_INSTANCE_ID })
    }).catch(() => {});
  }, [fallbackMenuItems, persistOrdersLocally]);

  // Set / Update Bill Requests Mutation
  const setBillRequests = useCallback((updater: BillRequest[] | ((prev: BillRequest[]) => BillRequest[])) => {
    let nextList: BillRequest[];
    if (typeof updater === 'function') {
      nextList = updater(billRequestsRef.current);
    } else {
      nextList = updater;
    }

    const cleanList = Array.isArray(nextList) ? nextList.filter((b: any) => b && Number(b.tableNumber) !== 0) : [];
    if (JSON.stringify(cleanList) === JSON.stringify(billRequestsRef.current)) {
      return;
    }

    lastBillsWriteTimeRef.current = Date.now();
    billRequestsRef.current = cleanList;
    setBillRequestsState(cleanList);
    persistBillsLocally(cleanList);

    // Broadcast 1: BroadcastChannel (0ms)
    try {
      if (billsChannelRef.current) {
        billsChannelRef.current.postMessage({ data: cleanList, senderId: VAULT_INSTANCE_ID });
      }
    } catch (e) {}

    // Broadcast 2: Realtime WebSocket (0ms)
    syncHub.emitSyncWrite('bill_requests', cleanList, VAULT_INSTANCE_ID);

    // Broadcast 3: Server API
    fetch('/api/sync/bill_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: cleanList, senderId: VAULT_INSTANCE_ID })
    }).then(() => {
      orderSyncWorker.triggerInstantSync();
    }).catch(() => {});
  }, [persistBillsLocally]);

  // Helper: Request Bill
  const requestBillForTable = useCallback((tableNum: number, customerName?: string, deviceId?: string, explicitTotal?: number) => {
    const tableNumVal = Number(tableNum);
    if (tableNumVal === 0 || isNaN(tableNumVal)) return;

    // Calculate total amount from active table orders accurately (includes all non-cancelled, non-settled orders)
    const tableActiveOrders = ordersRef.current.filter(
      o => Number(o.tableNumber) === tableNumVal && o.status !== 'cancelled' && !(o as any).settled
    );

    const calculatedTotal = tableActiveOrders.reduce((sum, o) => {
      let ordTotal = typeof o.total === 'number' ? o.total : parseFloat(o.total as any);
      if (isNaN(ordTotal) || ordTotal <= 0) {
        if (Array.isArray(o.items)) {
          ordTotal = o.items.reduce((s: number, i: any) => {
            const rawP = i?.menuItem?.price ?? i?.price ?? 0;
            const itemPrice = typeof rawP === 'number' ? rawP : (parseFloat(String(rawP)) || 0);
            const qty = typeof i.quantity === 'number' ? i.quantity : (parseInt(String(i.quantity), 10) || 1);
            return s + (itemPrice * qty);
          }, 0);
        } else {
          ordTotal = 0;
        }
      }
      return sum + ordTotal;
    }, 0);

    const passedTotal = typeof explicitTotal === 'number' ? explicitTotal : parseFloat(explicitTotal as any);
    const totalAmount = (!isNaN(passedTotal) && passedTotal > 0) ? passedTotal : calculatedTotal;

    const itemsCount = tableActiveOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
    const nowIso = new Date().toISOString();
    const billId = `bill_table_${tableNumVal}`;

    const newBill: BillRequest = {
      id: billId,
      tableNumber: tableNumVal,
      customerName,
      deviceId,
      requestedAt: nowIso,
      status: 'pending',
      totalAmount,
      itemsCount
    };

    const updatedBills = [newBill, ...billRequestsRef.current.filter(b => !(Number(b.tableNumber) === tableNumVal && b.status === 'pending'))];
    billRequestsRef.current = updatedBills;
    setBillRequestsState(updatedBills);
    persistBillsLocally(updatedBills);

    // Broadcast 1: BroadcastChannel (0ms)
    try {
      if (billsChannelRef.current) {
        billsChannelRef.current.postMessage({ data: updatedBills, senderId: VAULT_INSTANCE_ID });
      }
    } catch (e) {}

    // Broadcast 2: Realtime WebSocket (0ms)
    syncHub.emitSyncWrite('bill_requests', updatedBills, VAULT_INSTANCE_ID);

    // Broadcast 3: Post to sync endpoint
    fetch('/api/sync/bill_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: updatedBills, senderId: VAULT_INSTANCE_ID })
    }).catch(() => {});

    // Broadcast 4: Post to request-bill endpoint
    fetch('/api/tables/request-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber: tableNumVal, customerName, deviceId })
    }).then(() => {
      orderSyncWorker.triggerInstantSync();
    }).catch(() => {});
  }, [persistBillsLocally]);

  // Helper: Settle / Clear Bill Request for Table
  const settleBillForTable = useCallback((tableNum: number) => {
    const nowIso = new Date().toISOString();
    setBillRequests(prev => prev.map(b => {
      if (Number(b.tableNumber) === Number(tableNum) && b.status !== 'settled') {
        return { ...b, status: 'settled', settledAt: nowIso };
      }
      return b;
    }));
  }, [setBillRequests]);

  // Helper: Delete Order explicitly
  const deleteOrderPermanently = useCallback((orderId: string) => {
    const newDeleted = new Set(deletedIdsRef.current);
    newDeleted.add(orderId);
    deletedIdsRef.current = newDeleted;
    setDeletedOrderIds(newDeleted);

    try {
      localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(Array.from(newDeleted)));
    } catch (e) {}

    setOrders(prev => prev.filter(o => o.id !== orderId));

    fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE'
    }).then(() => {
      orderSyncWorker.triggerInstantSync();
    }).catch(() => {});
  }, [setOrders]);

  // Helper: Clear all orders and reset statistics completely
  const clearAllOrders = useCallback(async () => {
    lastOrdersWriteTimeRef.current = Date.now();
    lastBillsWriteTimeRef.current = Date.now();

    ordersRef.current = [];
    setOrdersState([]);
    billRequestsRef.current = [];
    setBillRequestsState([]);
    deletedIdsRef.current = new Set();
    setDeletedOrderIds(new Set());

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(ORDERS_STORAGE_KEY);
        localStorage.removeItem(DELETED_ORDERS_KEY);
        localStorage.removeItem(BILLS_STORAGE_KEY);
        localStorage.removeItem('smart_menu_orders');
        localStorage.removeItem('smart_menu_sync_orders');
        localStorage.removeItem('smart_orders_vault');
        localStorage.removeItem('smart_menu_sync_bill_requests');
      } catch (e) {}
    }

    try {
      if (ordersChannelRef.current) {
        ordersChannelRef.current.postMessage({ data: [], senderId: VAULT_INSTANCE_ID });
      }
      if (billsChannelRef.current) {
        billsChannelRef.current.postMessage({ data: [], senderId: VAULT_INSTANCE_ID });
      }
    } catch (e) {}

    try {
      await fetch('/api/orders/clear', { method: 'POST' });
      await fetch('/api/bills/clear', { method: 'POST' });
    } catch (e) {}

    try {
      await fetch('/api/sync/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [], senderId: VAULT_INSTANCE_ID })
      });
    } catch (e) {}

    orderSyncWorker.triggerInstantSync();
  }, []);

  return {
    orders,
    setOrders,
    billRequests,
    setBillRequests,
    mergeIncomingOrders,
    mergeIncomingBills,
    requestBillForTable,
    settleBillForTable,
    deleteOrderPermanently,
    clearAllOrders,
    triggerWorkerSync: () => orderSyncWorker.triggerInstantSync()
  };
}
