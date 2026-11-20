create table Acounts
(
    Id int primary key identity(1,1),
    FirstName nvarchar(256) not null,
    LastName nvarchar(256) not null,
    Email nvarchar(256) not null unique,
    Phone nvarchar(32) not null unique,
    PasswordHash varchar(64) not null
);

create table Players
(
    AccountId int primary key references Acounts(Id),
    Balance money not null,
    Nickname nvarchar(16) not null unique,
    InTotal money not null default 0,
    OutTotal money not null default 0
);

create table SportTypes
(
    Id int primary key,
    [Name] nvarchar(256) not null unique
);

create table SportMatches
(
    Id int primary key,
    [Date] datetime not null,
    TypeId int not null references SportTypes(Id),
    [Name] nvarchar(256) not null,
    Team1 nvarchar(256) not null,
    Team2 nvarchar(256) not null,
    Score1 int not null default 0,
    Score2 int not null default 0,
    Mult1 float not null default 1,
    Mult2 float not null default 1,
    MultDraw float null default 1
);

create table GameSessions
(
    Id int primary key identity(1,1),
    PlayerId int not null references Players(AccountId),
    StartDate datetime not null,
    EndDate datetime null,
    IsClosed bit not null default 0,
    Prize money null,
    multiplayer bit not null default 0,
    game_id int not null
);

create table AccountStatuses
(
    UserId int primary key references Acounts(Id),
    EmailVerified bit not null default 0,
    PhoneVerified bit not null default 0,
    AgeVerified bit not null default 0
);