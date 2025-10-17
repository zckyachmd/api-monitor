<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateUserAccount extends Command
{
    protected $signature = 'make:user {--name=} {--email=} {--password=}';

    protected $description = 'Create a user account (interactive if options omitted)';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Name', 'User');
        $email = $this->option('email') ?: $this->ask('Email');
        $password = $this->option('password') ?: $this->secret('Password (min 8 chars)');

        $data = compact('name', 'email', 'password');
        $v = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ]);
        if ($v->fails()) {
            foreach ($v->errors()->all() as $err) {
                $this->error($err);
            }
            return self::INVALID;
        }

        $existing = User::where('email', $email)->first();
        if ($existing) {
            $this->error("User with email {$email} already exists. Aborting.");
            return self::FAILURE;
        }

        $user = new User();
        $user->name = $name;
        $user->email = $email;
        $user->password = $password; // hashed via cast
        $user->save();

        $this->info("Created user: {$user->name} <{$user->email}>");
        return self::SUCCESS;
    }
}
