import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, EriCateringOrder, EriCateringMenu } from '../../lib/supabase';
import { UtensilsCrossed, Edit, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function EriCateringSection() {
  const { isAdmin } = useAuth();
  const [weeklyMenu, setWeeklyMenu] = useState<EriCateringMenu | null>(null);
  const [orders, setOrders] = useState<EriCateringOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [orderName, setOrderName] = useState('');
  const [editingMenu, setEditingMenu] = useState(false);
  const [menuText, setMenuText] = useState('');

  useEffect(() => {
    fetchWeeklyMenu();
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const fetchWeeklyMenu = async () => {
    try {
      const { data } = await supabase
        .from('eri_catering_menu')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      setWeeklyMenu(data);
      setMenuText(data?.weekly_menu || '');
    } catch (error) {
      console.error('Error fetching weekly menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase
        .from('eri_catering_orders')
        .select('*')
        .order('created_at', { ascending: false });

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderName.length < 3) {
      setMessage({ type: 'error', text: 'Nama harus minimal 3 karakter' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('eri_catering_orders')
        .insert([{ name: orderName }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Pesanan berhasil dikirim!' });
      setOrderName('');
      
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

  const updateWeeklyMenu = async () => {
    if (!menuText.trim()) return;

    try {
      // Check if menu exists
      if (weeklyMenu) {
        const { error } = await supabase
          .from('eri_catering_menu')
          .update({ 
            weekly_menu: menuText.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', weeklyMenu.id);

        if (error) throw error;
      } else {
        // Create new menu
        const { error } = await supabase
          .from('eri_catering_menu')
          .insert([{ 
            weekly_menu: menuText.trim()
          }]);

        if (error) throw error;
      }

      setEditingMenu(false);
      fetchWeeklyMenu();
      setMessage({ type: 'success', text: 'Menu mingguan berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating weekly menu:', error);
      setMessage({ type: 'error', text: 'Gagal memperbarui menu' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('eri_catering_orders')
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
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <UtensilsCrossed className="h-6 w-6 text-cyan-600" />
        <h2 className="text-xl font-bold text-gray-800">Eri Catering</h2>
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

      {/* Weekly Menu Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Menu Mingguan</h3>
          {isAdmin && (
            <button
              onClick={() => setEditingMenu(!editingMenu)}
              className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>

        {editingMenu && isAdmin ? (
          <div className="space-y-3">
            <textarea
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows={4}
              placeholder="Masukkan menu mingguan..."
            />
            <div className="flex gap-2">
              <button
                onClick={updateWeeklyMenu}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Simpan Menu
              </button>
              <button
                onClick={() => {
                  setEditingMenu(false);
                  setMenuText(weeklyMenu?.weekly_menu || '');
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {weeklyMenu?.weekly_menu || 'Menu mingguan belum tersedia'}
            </p>
            {weeklyMenu?.updated_at && (
              <p className="text-xs text-gray-400 mt-2">
                Terakhir diperbarui: {new Date(weeklyMenu.updated_at).toLocaleString('id-ID')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Order Form */}
      <form onSubmit={submitOrder} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Pemesan
          </label>
          <input
            type="text"
            value={orderName}
            onChange={(e) => setOrderName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Masukkan nama Anda"
            minLength={3}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-cyan-600 text-white py-3 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {submitting ? 'Mengirim...' : 'Pesan Catering'}
        </button>
      </form>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Panel Admin</h3>
          
          {/* Orders List */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Pesanan Catering</h4>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada pesanan</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{order.name}</p>
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