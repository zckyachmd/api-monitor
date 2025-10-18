<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportsController;

Route::redirect('/', '/dashboard');

Route::get('/login', function (Request $request) {
    if ($request->user()) {
        return redirect('/dashboard');
    }
    return Inertia::render('Auth/Login');
})->name('login')->middleware('guest');

Route::get('/dashboard', DashboardController::class)->middleware('auth');

Route::get('/reports', [ReportsController::class, 'index'])->middleware('auth');
Route::get('/reports/export', [ReportsController::class, 'export'])->middleware('auth');
