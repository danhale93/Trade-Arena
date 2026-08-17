CREATE TABLE `agent_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` varchar(16) NOT NULL DEFAULT 'INFO',
	`category` varchar(32) NOT NULL DEFAULT 'SYSTEM',
	`message` text NOT NULL,
	`details` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_logs_id` PRIMARY KEY(`id`)
);
