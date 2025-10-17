<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
