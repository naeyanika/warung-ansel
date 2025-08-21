import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Calendar, Coffee, Download, FileText, Trash2, User, Utensils, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import qrisAnsel from '../assets/qris-ansel.jpeg';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
import { EriCateringOrder, JastipOrder, supabase, WarungAuditOrder } from '../lib/supabase';

// Extend jsPDF type to include autoTable
interface OrderWithType extends JastipOrder {
  type: 'jastip';
  items: Array<{ name: string; price: number }>;
  additional?: string;
}

interface EriOrderWithType extends EriCateringOrder {
  type: 'eri_catering';
  items: Array<{ name: string; price: number }>;
}

interface WarungOrderWithType extends WarungAuditOrder {
  type: 'warung_audit';
  items: Array<{ name: string; price: number }>;
}

type AllOrders = OrderWithType | EriOrderWithType | WarungOrderWithType;

export default function OrdersManagement() {
  const [orders, setOrders] = useState<AllOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'jastip' | 'eri_catering' | 'warung_audit'>('all');
  const [activeTab, setActiveTab] = useState<'pesanan' | 'input'>('pesanan');

  // State untuk input invoice manual
  const [manualInvoice, setManualInvoice] = useState({
    name: '',
    type: 'jastip',
    items: [{ name: '', price: 0 }],
    created_at: new Date().toISOString(),
  });

  // Price management
  const [prices, setPrices] = useState<Record<string, number>>({
    // Default prices - admin can modify these
    'Nasi Gudeg': 15000,
    'Nasi Pecel': 12000,
    'Nasi Rawon': 18000,
    'Fore Coffee': 25000,
    'Es Kopi Susu': 20000,
    'Catering Harian': 25000,
  });

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch all order types
      const [jastipData, eriData, warungData] = await Promise.all([
        supabase.from('jastip_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('eri_catering_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('warung_audit_orders').select('*').order('created_at', { ascending: false })
      ]);

      const allOrders: AllOrders[] = [
        ...(jastipData.data || []).map(order => ({
          ...order,
          type: 'jastip' as const,
          items: [
            { name: order.breakfast, price: prices[order.breakfast] || 15000 },
            ...(order.coffee ? [{ name: order.coffee, price: prices[order.coffee] || 20000 }] : [])
          ]
        })),
        ...(eriData.data || []).map(order => ({
          ...order,
          type: 'eri_catering' as const,
          items: [{ name: 'Catering Harian', price: prices['Catering Harian'] || 25000 }]
        })),
        ...(warungData.data || []).map(order => ({
          ...order,
          type: 'warung_audit' as const,
          items: [{ name: `${order.food} x${order.quantity}`, price: (prices[order.food] || 15000) * order.quantity }]
        }))
      ];

      // Sort by created_at
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (order: AllOrders) => {
    try {
      let tableName = '';
      switch (order.type) {
        case 'jastip':
          tableName = 'jastip_orders';
          break;
        case 'eri_catering':
          tableName = 'eri_catering_orders';
          break;
        case 'warung_audit':
          tableName = 'warung_audit_orders';
          break;
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', order.id);

      if (error) throw error;
      
      fetchAllOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  // Helper: convert image url to base64
  function getBase64FromImageUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No ctx');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Generate invoice dengan QRIS di bawah
  const generateInvoice = async (order: AllOrders) => {
    const doc = new jsPDF();
    // ...header...
    doc.setFontSize(20);
    doc.setTextColor(6, 182, 212);
    doc.text('WARUNG ANSEL', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Anak Selatan', 20, 30);
    // ...info invoice...
    doc.setFontSize(16);
    doc.text('INVOICE', 20, 50);
    doc.setFontSize(10);
    doc.text(`Invoice #: ${order.id.slice(0, 8)}`, 20, 60);
    doc.text(`Tanggal: ${new Date(order.created_at).toLocaleDateString('id-ID')}`, 20, 70);
    doc.text(`Waktu: ${new Date(order.created_at).toLocaleTimeString('id-ID')}`, 20, 80);
    // ...customer info...
    doc.setFontSize(12);
    doc.text('PELANGGAN:', 20, 100);
    doc.setFontSize(10);
    doc.text(`Nama: ${order.name}`, 20, 110);
    doc.text(`Jenis: ${order.type === 'jastip' ? 'Jastip' : order.type === 'eri_catering' ? 'Eri Catering' : 'Warung Audit'}`, 20, 120);
    // ...items table...
    const tableData = order.items.map(item => [
      item.name,
      `Rp ${item.price.toLocaleString('id-ID')}`
    ]);
    const total = order.items.reduce((sum, item) => sum + item.price, 0);
    autoTable(doc, {
      startY: 140,
      head: [['Item', 'Harga']],
      body: tableData,
      foot: [['TOTAL', `Rp ${total.toLocaleString('id-ID')}`]],
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212] },
      footStyles: { fillColor: [6, 182, 212], fontStyle: 'bold' }
    });
    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 20 : 200;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Terima kasih atas pesanan Anda!', 20, finalY);
    doc.text('Warung Ansel - Anak Selatan', 20, finalY + 10);

    // Tambahkan QRIS di bawah invoice
    try {
      const base64 = await getBase64FromImageUrl(qrisAnsel);
      doc.addImage(base64, 'JPEG', 60, finalY + 20, 90, 90);
      doc.setFontSize(10);
      doc.text('Scan QRIS untuk pembayaran ke Ansel Shop', 60, finalY + 115);
    } catch (e) {
      // Jika gagal load gambar, tetap lanjut
      doc.setFontSize(10);
      doc.text('QRIS tidak dapat dimuat', 60, finalY + 30);
    }

    doc.save(`invoice-${order.name}-${order.id.slice(0, 8)}.pdf`);
  };

  const generateBulkInvoice = () => {
    if (selectedOrders.size === 0) return;
    
    const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id));
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(6, 182, 212);
    doc.text('WARUNG ANSEL', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Anak Selatan', 20, 30);
    
    // Bulk invoice info
    doc.setFontSize(16);
    doc.text('INVOICE GABUNGAN', 20, 50);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 60);
    doc.text(`Total Pesanan: ${selectedOrdersList.length}`, 20, 70);
    
    // All items table
    const allItems: Array<[string, string, string, string]> = [];
    let grandTotal = 0;
    
    selectedOrdersList.forEach(order => {
      const total = order.items.reduce((sum, item) => sum + item.price, 0);
      grandTotal += total;
      
      allItems.push([
        order.name,
        order.type === 'jastip' ? 'Jastip' : order.type === 'eri_catering' ? 'Eri Catering' : 'Warung Audit',
        order.items.map(item => item.name).join(', '),
        `Rp ${total.toLocaleString('id-ID')}`
      ]);
    });
    
    autoTable(doc, {
      startY: 90,
      head: [['Nama', 'Jenis', 'Items', 'Total']],
      body: allItems,
      foot: [['', '', 'GRAND TOTAL', `Rp ${grandTotal.toLocaleString('id-ID')}`]],
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212] },
      footStyles: { fillColor: [6, 182, 212], fontStyle: 'bold' }
    });
    
    doc.save(`invoice-gabungan-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const filteredOrders = filterType === 'all' ? orders : orders.filter(order => order.type === filterType);

  const getOrderIcon = (type: string) => {
    switch (type) {
      case 'jastip':
        return <Coffee className="h-4 w-4 text-cyan-600" />;
      case 'eri_catering':
        return <UtensilsCrossed className="h-4 w-4 text-cyan-600" />;
      case 'warung_audit':
        return <Utensils className="h-4 w-4 text-cyan-600" />;
      default:
        return <FileText className="h-4 w-4 text-cyan-600" />;
    }
  };

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'jastip':
        return 'Jastip';
      case 'eri_catering':
        return 'Eri Catering';
      case 'warung_audit':
        return 'Warung Audit';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
      {/* Tab Switch */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'pesanan' ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('pesanan')}
        >
          Pesanan Masuk
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'input' ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('input')}
        >
          Input Invoice
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'pesanan' ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-cyan-600" />
              <h2 className="text-xl font-bold text-gray-800">Kelola Pesanan</h2>
            </div>
            {selectedOrders.size > 0 && (
              <button
                onClick={generateBulkInvoice}
                className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                Invoice Gabungan ({selectedOrders.size})
              </button>
            )}
          </div>
          {/* Filter */}
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'jastip', label: 'Jastip' },
                { value: 'eri_catering', label: 'Eri Catering' },
                // { value: 'warung_audit', label: 'Warung Audit' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value as any)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    filterType === filter.value
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada pesanan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Tabel shadcn */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={selectedOrders.size === filteredOrders.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
                          } else {
                            setSelectedOrders(new Set());
                          }
                        }}
                        className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Additional</TableHead>
                    {/* <TableHead>Total</TableHead> */}
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const total = order.items.reduce((sum, item) => sum + item.price, 0);
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getOrderIcon(order.type)}
                            <span className="text-sm font-medium text-gray-700">
                              {getOrderTypeLabel(order.type)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-800">{order.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {order.items.map((item, index) => (
                              <div key={index}>{item.name}</div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 whitespace-pre-line">
                            {order.type === 'jastip' && 'additional' in order && order.additional ? order.additional : '-'}
                          </div>
                        </TableCell>
                        {/* <TableCell>
                          <span className="font-semibold text-green-600">
                            Rp {total.toLocaleString('id-ID')}
                          </span>
                        </TableCell> */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleTimeString('id-ID')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => generateInvoice(order)}
                              className="p-1 text-cyan-600 hover:bg-cyan-100 rounded transition-colors"
                              title="Generate Invoice"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteOrder(order)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Hapus Pesanan"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Summary */}
          {filteredOrders.length > 0 && (
            <div className="mt-6 p-4 bg-cyan-50 rounded-lg">
              <span className="text-gray-700">Total Pesanan: {filteredOrders.length}</span>
            </div>
          )}
        </>
      ) : (
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Input Invoice Manual</h2>
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              // Generate invoice manual tanpa simpan ke database
              generateInvoice({
                id: 'manual-' + Date.now(),
                name: manualInvoice.name,
                type: manualInvoice.type as any,
                items: manualInvoice.items,
                created_at: manualInvoice.created_at,
              } as AllOrders);
            }}
          >
            {/* Pilih pesanan masuk */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ambil dari Pesanan Masuk</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={''}
                onChange={e => {
                  const orderId = e.target.value;
                  if (!orderId) return;
                  const order = orders.find(o => o.id === orderId);
                  if (order) {
                    setManualInvoice({
                      name: order.name,
                      type: order.type,
                      items: order.items.map(i => ({ name: i.name, price: 0 })),
                      created_at: order.created_at,
                    });
                  }
                }}
              >
                <option value="">-- Pilih Pesanan --</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id}>
                    [{getOrderTypeLabel(order.type)}] {order.name} - {order.items.map(i => i.name).join(', ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={manualInvoice.name}
                onChange={e => setManualInvoice({ ...manualInvoice, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={manualInvoice.type}
                onChange={e => setManualInvoice({ ...manualInvoice, type: e.target.value })}
              >
                <option value="jastip">Jastip</option>
                <option value="eri_catering">Eri Catering</option>
                <option value="warung_audit">Warung Audit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items</label>
              {manualInvoice.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Nama Item"
                    value={item.name}
                    onChange={e => {
                      const items = manualInvoice.items.slice();
                      items[idx].name = e.target.value;
                      setManualInvoice({ ...manualInvoice, items });
                    }}
                    required
                  />
                  <input
                    type="number"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Harga"
                    value={item.price}
                    onChange={e => {
                      const items = manualInvoice.items.slice();
                      items[idx].price = Number(e.target.value);
                      setManualInvoice({ ...manualInvoice, items });
                    }}
                    required
                    min={0}
                  />
                  {manualInvoice.items.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 px-2"
                      onClick={() => {
                        setManualInvoice({
                          ...manualInvoice,
                          items: manualInvoice.items.filter((_, i) => i !== idx),
                        });
                      }}
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="text-cyan-600 hover:underline text-sm"
                onClick={() => setManualInvoice({
                  ...manualInvoice,
                  items: [...manualInvoice.items, { name: '', price: 0 }],
                })}
              >Tambah Item</button>
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors font-semibold"
            >
              Generate Invoice
            </button>
          </form>
          {/* QRIS Section */}
          <div className="mt-8 flex flex-col items-center">
            <img
              src={qrisAnsel}
              alt="QRIS Ansel Shop"
              className="w-64 rounded-lg shadow border"
            />
            <div className="mt-2 text-xs text-gray-500 text-center">
              Scan QRIS untuk pembayaran ke Ansel Shop
            </div>
          </div>
        </div>
      )}
    </div>
  );
}