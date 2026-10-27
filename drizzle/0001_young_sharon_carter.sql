CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationSchema` varchar(1000) NOT NULL,
	`decompositions` text NOT NULL,
	`functionalDependencies` text NOT NULL,
	`verdict` varchar(64) NOT NULL,
	`summary` text NOT NULL,
	`resultJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
