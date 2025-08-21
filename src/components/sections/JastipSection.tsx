import { AlertCircle, CheckCircle, Coffee, Edit, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BreakfastItem, JastipOrder, supabase } from '../../lib/supabase';


export default function JastipSection() {
  const { isAdmin } = useAuth();
  const [breakfastItems, setBreakfastItems] = useState<BreakfastItem[]>([]);
  const [orders, setOrders] = useState<JastipOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ON/OFF state for order form
  const [orderFormActive, setOrderFormActive] = useState(true);

  // Form states
  const [orderForm, setOrderForm] = useState({
    name: '',
    breakfast: '',
    coffee: 'Fore Coffee',
    additional: ''
  });

  // Admin form states
  const [newBreakfastItem, setNewBreakfastItem] = useState('');
  const [editingBreakfast, setEditingBreakfast] = useState<{ id: string; name: string } | null>(null);
  const [coffeeTitle, setCoffeeTitle] = useState('Fore Coffee');

  useEffect(() => {
    fetchBreakfastItems();
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const fetchBreakfastItems = async () => {
    try {
      const { data } = await supabase
        .from('breakfast_items')
        .select('*')
        .eq('is_active', true)
        .order('name');

      setBreakfastItems(data || []);
    } catch (error) {
      console.error('Error fetching breakfast items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase
        .from('jastip_orders')
        .select('*')
        .order('created_at', { ascending: false });

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderForm.name.length < 3) {
      setMessage({ type: 'error', text: 'Nama harus minimal 3 karakter' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('jastip_orders')
        .insert([{
          name: orderForm.name,
          breakfast: orderForm.breakfast,
          coffee: orderForm.coffee,
          additional: orderForm.additional
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Pesanan berhasil dikirim!' });
      setOrderForm({ name: '', breakfast: '', coffee: coffeeTitle, additional: '' });
      
      if (isAdmin) {
        fetchOrders();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengirim pesanan' });
      console.error('Error submitting order:', error);
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const addBreakfastItem = async () => {
    if (!newBreakfastItem.trim()) return;

    try {
      const { error } = await supabase
        .from('breakfast_items')
        .insert([{ name: newBreakfastItem.trim() }]);

      if (error) throw error;

      setNewBreakfastItem('');
      fetchBreakfastItems();
    } catch (error) {
      console.error('Error adding breakfast item:', error);
    }
  };

  const updateBreakfastItem = async () => {
    if (!editingBreakfast || !editingBreakfast.name.trim()) return;

    try {
      const { error } = await supabase
        .from('breakfast_items')
        .update({ name: editingBreakfast.name.trim() })
        .eq('id', editingBreakfast.id);

      if (error) throw error;

      setEditingBreakfast(null);
      fetchBreakfastItems();
    } catch (error) {
      console.error('Error updating breakfast item:', error);
    }
  };

  const deleteBreakfastItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('breakfast_items')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      fetchBreakfastItems();
    } catch (error) {
      console.error('Error deleting breakfast item:', error);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jastip_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6 justify-between">
        <div className="flex items-center gap-3">
          <Coffee className="h-6 w-6 text-cyan-600" />
          <h2 className="text-xl font-bold text-gray-800">Jastip</h2>
          <span className="text-sm text-gray-500">Sarapan & Kopi Pagi</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setOrderFormActive(v => !v)}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${orderFormActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
            title="Aktifkan/Nonaktifkan Form Order"
          >
            {orderFormActive ? 'Form ON' : 'Form OFF'}
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Order Form ON/OFF */}
      {orderFormActive ? (
        <form onSubmit={submitOrder} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama (minimal 3 karakter)
            </label>
            <input
              type="text"
              value={orderForm.name}
              onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Masukkan nama Anda"
              minLength={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Sarapan
            </label>
            <select
              value={orderForm.breakfast}
              onChange={(e) => setOrderForm({ ...orderForm, breakfast: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            >
              <option value="">Pilih sarapan...</option>
              {breakfastItems.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Request (opsional)
            </label>
            <textarea
              value={orderForm.additional}
              onChange={e => setOrderForm({ ...orderForm, additional: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Contoh: tanpa sambal, request khusus, dll."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {coffeeTitle}
            </label>
            <input
              type="text"
              value={orderForm.coffee}
              onChange={(e) => setOrderForm({ ...orderForm, coffee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Es Kopi Susu, dll."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cyan-600 text-white py-3 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? 'Mengirim...' : 'Pesan Sekarang'}
          </button>
        </form>
      ) : (
        <div className="text-center text-gray-500 my-8">Form order sedang dimatikan admin.</div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="border-t pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Panel Admin</h3>

          {/* Coffee Title Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul Kopi
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coffeeTitle}
                onChange={(e) => setCoffeeTitle(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Fore Coffee"
              />
              <button
                onClick={() => setOrderForm({ ...orderForm, coffee: coffeeTitle })}
                className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors"
              >
                Update
              </button>
            </div>
          </div>

          {/* Add New Breakfast Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tambah Menu Sarapan
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBreakfastItem}
                onChange={(e) => setNewBreakfastItem(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Nama menu sarapan baru"
              />
              <button
                onClick={addBreakfastItem}
                disabled={!newBreakfastItem.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Manage Breakfast Items */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Kelola Menu Sarapan</h4>
            <div className="space-y-2">
              {breakfastItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  {editingBreakfast?.id === item.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingBreakfast.name}
                        onChange={(e) => setEditingBreakfast({ ...editingBreakfast, name: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <button
                        onClick={updateBreakfastItem}
                        className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditingBreakfast(null)}
                        className="px-2 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                      <button
                        onClick={() => setEditingBreakfast({ id: item.id, name: item.name })}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteBreakfastItem(item.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Pesanan Masuk</h4>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada pesanan</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{order.name}</p>
                        <p className="text-sm text-gray-600">Sarapan: {order.breakfast}</p>
                        {order.coffee && (
                          <p className="text-sm text-gray-600">Kopi: {order.coffee}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}