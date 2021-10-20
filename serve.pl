#!/usr/bin/perl
use strict;
use Socket;

sub sendHTTPErrPage {
	my ($socket, $code, $reason) = @_;  # add support for additional headers
	print $socket "HTTP/1.1 $code $reason\r\nContent-Type: text/html\r\n\r\n<h1>$code $reason</h1>";
}

sub isPathForbidden {
	my ($path) = @_;
	my @subdirs = split('/', $path);
	my $depth = 0;
	foreach (@subdirs) {
		if ($_ eq ".." && $depth == ) {
			return 0 if ($depth == 0) {  # going above server root
			--$depth;
		} else {
			++$depth if $_ ne "";
		}
	}
	return 1;
}

sub main {
	# Get port from command line, otherwise default to 80
	my ($workingDir, $port) = @ARGV;

	if (not defined $port) {
		$port = 80;
	}

	# Create tcp socket on localhost and listen
	my $proto = getprotobyname("tcp");
	socket(my $server, PF_INET, SOCK_STREAM, $proto) || die "socket: $!";
	setsockopt($server, SOL_SOCKET, SO_REUSEADDR, pack("l", 1)) || die "setsockopt: $!";
	bind($server, sockaddr_in($port, inet_aton("localhost"))) || die "bind: $!";
	listen($server, SOMAXCONN) || die "listen: $!";
	print "Server started on localhost:$port\n";

	for (my $paddr; $paddr = accept(my $client, $server); close $client) {
		# Read request line
		my ($method, $target, $protoVersion) = split(/\s/, <$client>);

		my $datetime = localtime();
		print "[$datetime] $method $target\n";

		# only GET and HEAD are required to be implemented
		if ($method ne "GET" && $method ne "HEAD") {
			if ($method eq "BREW") {
				sendHTTPErrPage($client, 418, "I'm a teapot");
			} else {
				sendHTTPErrPage($client, 501, "Not Implemented");
			}
			next;
		}

		sendHTTPErrPage($client, 505, "HTTP Version Not Supported") if ($protoVersion ne "HTTP/1.1");
		sendHTTPErrPage($client, 403, "Forbidden") if (!isPathForbidden($target));


		# Collect headers
		my %headers;
		while (my $headerLine = <$client>) {
			$headerLine =~ s/\r?\n$//;
			if ($headerLine eq "") {
				last;
			}
			my ($headerField, $headerValue) = split(/:/, $headerLine, 1);
			$headers{$headerField} = $headerValue;
		}

		# Handle headers

		# Locate target
		$target = "$workingDir/$target";  # move root to server working directory
		if (-d $target) {
			$target = $target . '/index.html';
		}
		if (!-e $target) {
			sendHTTPErrPage($client, 404, "Not Found");
			next;
		}

		# The page exists!
		open(my $fh, "<:raw", $target);
		if (not defined $fh) {
			sendHTTPErrPage($client, 500, "Internal Server Error");
			next;
		}

		print $client "HTTP/1.1 200 OK\r\n";

		# send headers

		print $client "\r\n";

		my $bytesRead;
		do {
			$bytesRead = read($fh, my $bytes, 1024);
			print $client $bytes;
		} while ($bytesRead == 1024);
	}
}

&main();
