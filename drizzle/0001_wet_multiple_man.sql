CREATE TABLE `atualizacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` varchar(50) NOT NULL,
	`descricao` text,
	`qtd_inseridas` int NOT NULL DEFAULT 0,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `atualizacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `noticias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`fonte` varchar(100) NOT NULL,
	`data_publicacao` timestamp,
	`resumo` text,
	`categoria` enum('presidente','governador','senador','geral') NOT NULL DEFAULT 'geral',
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `noticias_id` PRIMARY KEY(`id`),
	CONSTRAINT `noticias_url_unique` UNIQUE(`url`)
);
