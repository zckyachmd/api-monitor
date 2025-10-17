<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\ReportsController;

Route::redirect('/', '/dashboard');

// Auth: Login page (guest-only)
Route::get('/login', function (Request $request) {
    if ($request->user()) {
        return redirect('/dashboard');
    }
    return Inertia::render('Auth/Login');
})->name('login')->middleware('guest');

// Protected dashboard
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware('auth');

// Reports (metrics visualizations)
Route::get('/reports', [ReportsController::class, 'index'])->middleware('auth');
Route::get('/reports/export', [ReportsController::class, 'export'])->middleware('auth');
