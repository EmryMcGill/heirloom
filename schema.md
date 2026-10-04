# schema

-- Core Users Table
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
username VARCHAR(50) UNIQUE NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipes (Can exist independently without a book)
CREATE TABLE recipes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
title VARCHAR(255) NOT NULL,
description TEXT,
servings INT,
prep_time_minutes INT,
cook_time_minutes INT,
ingredients JSONB NOT NULL, -- Structured list: [{name, amount, unit}]
instructions JSONB NOT NULL, -- Ordered list: [{step, text}]
is_public BOOLEAN DEFAULT false,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe Books
CREATE TABLE books (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
title VARCHAR(255) NOT NULL,
description TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction: Recipes to Books (Many-to-Many: Recipe can be in multiple books)
CREATE TABLE book_recipes (
book_id UUID REFERENCES books(id) ON DELETE CASCADE,
recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
PRIMARY KEY (book_id, recipe_id)
);

-- Junction: User Favorites (Many-to-Many: Quick bookmarking)
CREATE TABLE user_favorites (
user_id UUID REFERENCES users(id) ON DELETE CASCADE,
recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
PRIMARY KEY (user_id, recipe_id)
);

-- Junction: Shared Books & Permissions (Collaboration)
CREATE TABLE book_collaborators (
book_id UUID REFERENCES books(id) ON DELETE CASCADE,
user_id UUID REFERENCES users(id) ON DELETE CASCADE,
role VARCHAR(20) NOT NULL CHECK (role IN ('editor', 'viewer')),
invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
PRIMARY KEY (book_id, user_id)
);
