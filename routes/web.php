<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportsController;

Route::redirect('/', '/dashboard');

Route::middleware('guest')->group(function () {
    Route::get('/login', function (Request $request) {
        if ($request->user()) {
            return redirect('/dashboard');
        }
        return Inertia::render('Auth/Login');
    })->name('login');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class);

    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportsController::class, 'index']);
        Route::get('/export', [ReportsController::class, 'export']);
    });
});
