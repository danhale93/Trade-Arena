CREATE TABLE `pulse_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`network` varchar(32) NOT NULL,
	`route` varchar(255) NOT NULL,
	`netProfitUsd` varchar(32) NOT NULL,
	`thresholdUsd` varchar(32) NOT NULL,
	`source` varchar(32) NOT NULL DEFAULT 'simulation',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pulse_events_id` PRIMARY KEY(`id`)
);
