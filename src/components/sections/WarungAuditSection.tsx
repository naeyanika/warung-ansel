import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, FoodItem, WarungAuditOrder } from '../../lib/supabase';
import { Utensils, Plus, Trash2, Edit, CheckCircle, AlertCircle } from 'lucide-react';

export default function WarungAuditSection() {
  const { isAdmin } = useAuth();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<WarungAuditOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [orderForm, setOrderForm] = useState({
    name: '',
    food: '',
    quantity: 1
  });

  // Admin form states
  const [newFoodItem, setNewFoodItem] = useState('');
  const [editingFood, setEditingFood] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchFoodItems();
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const fetchFoodItems = async () => {
    try {
      const { data } = await supabase
        .from('food_items')
        .select('*')
        .eq('is_active', true)
        .order('name');

      setFoodItems(data || []);
    } catch (error) {
      console.error('Error fetching food items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase
        .from('warung_audit_orders')
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

    if (orderForm.quantity < 1) {
      setMessage({ type: 'error', text: 'Jumlah harus minimal 1' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('warung_audit_orders')
        .insert([{
          name: orderForm.name,
          food: orderForm.food,
          quantity: orderForm.quantity
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Pesanan berhasil dikirim!' });
      setOrderForm({ name: '', food: '', quantity: 1 });
      
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

  const addFoodItem = async () => {
    if (!newFoodItem.trim()) return;

    try {
      const { error } = await supabase
        .from('food_items')
        .insert([{ name: newFoodItem.trim() }]);

      if (error) throw error;

      setNewFoodItem('');
      fetchFoodItems();
    } catch (error) {
      console.error('Error adding food item:', error);
    }
  };

  const updateFoodItem = async () => {
    if (!editingFood || !editingFood.name.trim()) return;

    try {
      const { error } = await supabase
        .from('food_items')
        .update({ name: editingFood.name.trim() })
        .eq('id', editingFood.id);

      if (error) throw error;

      setEditingFood(null);
      fetchFoodItems();
    } catch (error) {
      console.error('Error updating food item:', error);
    }
  };

  const deleteFoodItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      fetchFoodItems();
    } catch (error) {
      console.error('Error deleting food item:', error);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('warung_audit_orders')
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
      <div className="flex items-center gap-3 mb-6">
        <Utensils className="h-6 w-6 text-cyan-600" />
        <h2 className="text-xl font-bold text-gray-800">Warung Audit</h2>
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

      {/* Order Form */}
      <form onSubmit={submitOrder} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Pemesan
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
            Pilih Makanan
          </label>
          <select
            value={orderForm.food}
            onChange={(e) => setOrderForm({ ...orderForm, food: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          >
            <option value="">Pilih makanan...</option>
            {foodItems.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah
          </label>
          <input
            type="number"
            value={orderForm.quantity}
            onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            min="1"
            required
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

      {/* Admin Controls */}
      {isAdmin && (
        <div className="border-t pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Panel Admin</h3>
          
          {/* Add New Food Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tambah Menu Makanan
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFoodItem}
                onChange={(e) => setNewFoodItem(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Nama makanan baru"
              />
              <button
                onClick={addFoodItem}
                disabled={!newFoodItem.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Manage Food Items */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Kelola Menu Makanan</h4>
            <div className="space-y-2">
              {foodItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  {editingFood?.id === item.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingFood.name}
                        onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <button
                        onClick={updateFoodItem}
                        className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditingFood(null)}
                        className="px-2 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                      <button
                        onClick={() => setEditingFood({ id: item.id, name: item.name })}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteFoodItem(item.id)}
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
                        <p className="text-sm text-gray-600">
                          {order.food} × {order.quantity}
                        </p>
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