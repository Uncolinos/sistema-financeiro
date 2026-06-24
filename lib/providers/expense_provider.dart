import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';
import '../models/expense_model.dart';

class ExpenseProvider extends ChangeNotifier {
  late Box<dynamic> _expensesBox;
  List<Expense> _expenses = [];

  List<Expense> get expenses => _expenses;

  double get totalExpenses => _expenses.fold(0, (sum, expense) => sum + expense.amount);

  List<Expense> get monthExpenses {
    final now = DateTime.now();
    return _expenses.where((expense) {
      return expense.date.month == now.month && expense.date.year == now.year;
    }).toList();
  }

  double get monthTotal => monthExpenses.fold(0, (sum, expense) => sum + expense.amount);

  Map<String, double> get categoryTotals {
    final Map<String, double> totals = {};
    for (var expense in _expenses) {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
    }
    return totals;
  }

  ExpenseProvider() {
    _initHive();
  }

  Future<void> _initHive() async {
    _expensesBox = Hive.box('expenses');
    _loadExpenses();
  }

  void _loadExpenses() {
    _expenses = _expensesBox.values
        .cast<Map<String, dynamic>>()
        .map((e) => Expense.fromMap(e))
        .toList();
    _expenses.sort((a, b) => b.date.compareTo(a.date));
    notifyListeners();
  }

  Future<void> addExpense({
    required String title,
    required double amount,
    required String category,
    DateTime? date,
    String? description,
  }) async {
    final expense = Expense(
      id: const Uuid().v4(),
      title: title,
      amount: amount,
      category: category,
      date: date ?? DateTime.now(),
      description: description,
    );

    await _expensesBox.add(expense.toMap());
    _loadExpenses();
  }

  Future<void> deleteExpense(String id) async {
    final index = _expensesBox.values.toList().indexWhere((e) {
      final expense = Expense.fromMap(e);
      return expense.id == id;
    });

    if (index != -1) {
      await _expensesBox.deleteAt(index);
      _loadExpenses();
    }
  }

  Future<void> updateExpense({
    required String id,
    required String title,
    required double amount,
    required String category,
    DateTime? date,
    String? description,
  }) async {
    final index = _expensesBox.values.toList().indexWhere((e) {
      final expense = Expense.fromMap(e);
      return expense.id == id;
    });

    if (index != -1) {
      final updatedExpense = Expense(
        id: id,
        title: title,
        amount: amount,
        category: category,
        date: date ?? DateTime.now(),
        description: description,
      );
      await _expensesBox.putAt(index, updatedExpense.toMap());
      _loadExpenses();
    }
  }

  List<Expense> getExpensesByCategory(String category) {
    return _expenses.where((e) => e.category == category).toList();
  }

  List<Expense> getExpensesByDateRange(DateTime start, DateTime end) {
    return _expenses
        .where((e) => e.date.isAfter(start) && e.date.isBefore(end))
        .toList();
  }
}