import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  ArrowRightLeft, 
  Landmark, 
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from 'lucide-react';

const TRANSACTIONS = [
  {
    id: 1,
    title: 'Inspection Bonus - ID.4',
    date: 'Today, 14:30',
    amount: '+ ETB 500.00',
    type: 'income'
  },
  {
    id: 2,
    title: 'Deal Closed - Corolla',
    date: 'Yesterday, 09:15',
    amount: '+ ETB 2,500.00',
    type: 'income'
  },
  {
    id: 3,
    title: 'Withdrawal to CBE',
    date: 'Mon, 10:00',
    amount: '- ETB 1,000.00',
    type: 'expense'
  },
  {
    id: 4,
    title: 'Inspection Bonus - Vitz',
    date: 'Sun, 16:45',
    amount: '+ ETB 200.00',
    type: 'income'
  }
];

export default function Wallet() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gradient-to-b from-[#0033FF] via-[#020A2F] to-[#050511] text-white overflow-y-auto no-scrollbar pb-32 pt-20"
      style={{ zIndex: 0 }}
    >
      {/* Balance Section */}
      <div className="flex flex-col items-center justify-center pt-8 pb-10">
        <p className="text-white/70 text-sm font-medium mb-1">Staff · Available Balance</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-semibold opacity-90">ETB</span>
          <span className="text-6xl font-extrabold tracking-tighter">14,500</span>
          <span className="text-3xl font-semibold opacity-90">.00</span>
        </div>
        <button className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md rounded-full text-sm font-semibold border border-white/5">
          Withdraw Funds
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6 px-6 mb-8">
        {[
          { icon: Plus, label: 'Add Bank' },
          { icon: ArrowRightLeft, label: 'Transfer' },
          { icon: Landmark, label: 'Taxes' },
          { icon: MoreHorizontal, label: 'More' },
        ].map((action, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <button className="w-14 h-14 bg-white/10 hover:bg-white/20 transition-all rounded-full flex items-center justify-center backdrop-blur-md border border-white/5 shadow-lg">
              <action.icon size={22} className="text-white" />
            </button>
            <span className="text-xs font-medium text-white/80">{action.label}</span>
          </div>
        ))}
      </div>

      {/* Transactions List */}
      <div className="px-4">
        <div className="bg-[#10142A]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/90">Recent Activity</h3>
            <button className="text-sm text-blue-400 font-medium hover:underline">See all</button>
          </div>

          <div className="flex flex-col gap-5">
            {TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                    {tx.type === 'income' ? (
                      <ArrowDownRight size={18} className="text-emerald-400" />
                    ) : (
                      <ArrowUpRight size={18} className="text-white/60" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors">{tx.title}</p>
                    <p className="text-xs text-white/50">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-white/90'}`}>
                    {tx.amount}
                  </p>
                  {tx.type === 'income' && (
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <CheckCircle2 size={10} className="text-emerald-500" />
                      <span className="text-[10px] text-white/40 uppercase">Settled</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gamification Teaser */}
        <div className="mt-4 bg-[#10142A]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-5 shadow-2xl flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/90 mb-1">Next Payout Tier</h3>
            <p className="text-xs text-white/50">2 more inspections to reach 1.5% commission.</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-blue-400 flex items-center justify-center rotate-45">
            <div className="w-full h-full rounded-full bg-blue-500/20 -rotate-45 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">8/10</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
