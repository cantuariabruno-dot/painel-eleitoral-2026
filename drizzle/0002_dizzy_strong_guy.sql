CREATE TABLE `candidatos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(200) NOT NULL,
	`nome_abrev` varchar(60),
	`partido` varchar(60),
	`cargo` enum('presidente','governador','senador') NOT NULL,
	`estado` varchar(2),
	`cor_hex` varchar(7) NOT NULL DEFAULT '#888888',
	`foto_url` text,
	`ativo` boolean NOT NULL DEFAULT true,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidatos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intencoes_voto` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pesquisa_id` int NOT NULL,
	`candidato_id` int NOT NULL,
	`percentual` decimal(5,2) NOT NULL,
	CONSTRAINT `intencoes_voto_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pesquisas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituto` varchar(100) NOT NULL,
	`data_coleta` date NOT NULL,
	`data_publicacao` date,
	`cargo` enum('presidente','governador','senador') NOT NULL,
	`estado` varchar(2),
	`turno` enum('1','2') NOT NULL DEFAULT '1',
	`margem_erro` decimal(4,2),
	`tamanho_amostra` int,
	`fonte_url` text,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pesquisas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `previsoes_estado` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estado_uf` varchar(2) NOT NULL,
	`cargo` enum('presidente','senador') NOT NULL,
	`candidato_id_lider` int,
	`percentual_lider` decimal(5,2),
	`candidato_id_segundo` int,
	`percentual_segundo` decimal(5,2),
	`data_atualizacao` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `previsoes_estado_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `senado_cadeiras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estado_uf` varchar(2) NOT NULL,
	`senador_nome` varchar(200),
	`partido` varchar(60),
	`cor_hex` varchar(7) DEFAULT '#888888',
	`mandato_fim` int,
	`em_disputa_2026` boolean NOT NULL DEFAULT false,
	`candidato_id_previsto` int,
	`status` enum('atual','previsto','indefinido') NOT NULL DEFAULT 'atual',
	CONSTRAINT `senado_cadeiras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `atualizacoes` MODIFY COLUMN `qtd_inseridas` int;--> statement-breakpoint
ALTER TABLE `noticias` MODIFY COLUMN `titulo` text NOT NULL;--> statement-breakpoint
ALTER TABLE `noticias` MODIFY COLUMN `categoria` varchar(20) NOT NULL DEFAULT 'geral';