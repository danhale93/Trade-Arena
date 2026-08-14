CREATE TABLE `agent_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_state_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_state_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `balance_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`baseBal` varchar(32) NOT NULL,
	`arbitrumBal` varchar(32) NOT NULL,
	`optimismBal` varchar(32) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `balance_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `heartbeat_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`name` varchar(128) NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `heartbeat_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `heartbeat_tasks_taskUid_unique` UNIQUE(`taskUid`)
);
--> statement-breakpoint
CREATE TABLE `trade_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`network` varchar(32) NOT NULL,
	`tokenPair` varchar(64) NOT NULL,
	`netProfitUsd` varchar(32) NOT NULL,
	`txHash` varchar(128) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'success',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_history_id` PRIMARY KEY(`id`)
);
