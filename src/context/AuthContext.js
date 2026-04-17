// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(100000); // Virtual ₹1,00,000

  useEffect(() => {
    const stored = localStorage.getItem('sv_user');
    if (stored) setUser(JSON.parse(stored));
    const storedPortfolio = localStorage.getItem('sv_portfolio');
    if (storedPortfolio) setPortfolio(JSON.parse(storedPortfolio));
    const storedWatchlist = localStorage.getItem('sv_watchlist');
    if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));
    const storedTxns = localStorage.getItem('sv_transactions');
    if (storedTxns) setTransactions(JSON.parse(storedTxns));
    const storedBalance = localStorage.getItem('sv_balance');
    if (storedBalance) setBalance(parseFloat(storedBalance));
  }, []);

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('sv_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      localStorage.setItem('sv_user', JSON.stringify(found));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const signup = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('sv_users') || '[]');
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser = { id: Date.now(), name, email, password, joinDate: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('sv_users', JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem('sv_user', JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sv_user');
  };

  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      const updated = [...watchlist, symbol];
      setWatchlist(updated);
      localStorage.setItem('sv_watchlist', JSON.stringify(updated));
    }
  };

  const removeFromWatchlist = (symbol) => {
    const updated = watchlist.filter(s => s !== symbol);
    setWatchlist(updated);
    localStorage.setItem('sv_watchlist', JSON.stringify(updated));
  };

  const buyStock = (symbol, name, qty, price) => {
    const total = qty * price;
    if (total > balance) return { success: false, error: 'Insufficient balance' };
    
    const newBalance = balance - total;
    setBalance(newBalance);
    localStorage.setItem('sv_balance', newBalance.toString());

    const existing = portfolio.find(p => p.symbol === symbol);
    let updatedPortfolio;
    if (existing) {
      const newQty = existing.qty + qty;
      const newAvg = ((existing.avgPrice * existing.qty) + (price * qty)) / newQty;
      updatedPortfolio = portfolio.map(p =>
        p.symbol === symbol ? { ...p, qty: newQty, avgPrice: newAvg } : p
      );
    } else {
      updatedPortfolio = [...portfolio, { symbol, name, qty, avgPrice: price, buyDate: new Date().toISOString() }];
    }
    setPortfolio(updatedPortfolio);
    localStorage.setItem('sv_portfolio', JSON.stringify(updatedPortfolio));

    const txn = { id: Date.now(), type: 'BUY', symbol, name, qty, price, total, date: new Date().toISOString() };
    const updatedTxns = [txn, ...transactions];
    setTransactions(updatedTxns);
    localStorage.setItem('sv_transactions', JSON.stringify(updatedTxns));
    return { success: true };
  };

  const sellStock = (symbol, qty, price) => {
    const holding = portfolio.find(p => p.symbol === symbol);
    if (!holding || holding.qty < qty) return { success: false, error: 'Not enough shares' };

    const total = qty * price;
    const newBalance = balance + total;
    setBalance(newBalance);
    localStorage.setItem('sv_balance', newBalance.toString());

    let updatedPortfolio;
    if (holding.qty === qty) {
      updatedPortfolio = portfolio.filter(p => p.symbol !== symbol);
    } else {
      updatedPortfolio = portfolio.map(p =>
        p.symbol === symbol ? { ...p, qty: p.qty - qty } : p
      );
    }
    setPortfolio(updatedPortfolio);
    localStorage.setItem('sv_portfolio', JSON.stringify(updatedPortfolio));

    const txn = { id: Date.now(), type: 'SELL', symbol, name: holding.name, qty, price, total, date: new Date().toISOString() };
    const updatedTxns = [txn, ...transactions];
    setTransactions(updatedTxns);
    localStorage.setItem('sv_transactions', JSON.stringify(updatedTxns));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      user, login, signup, logout,
      portfolio, watchlist, transactions, balance,
      addToWatchlist, removeFromWatchlist, buyStock, sellStock
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
