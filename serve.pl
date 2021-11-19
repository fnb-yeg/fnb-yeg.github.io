#!/usr/bin/perl
# serve.pl PATH <port>
#  PATH is the path of the server root. This is required.
#  port is the port to serve on. The default value is 80.

use strict;
use Socket;

sub sendHTTPErrPage {
	my ($socket, $code, $reason) = @_;  # add support for additional headers
	print $socket "HTTP/1.1 $code $reason\r\nContent-Type: text/html\r\n\r\n<!DOCTYPE html><html><head><title>Error $code</title></head><body><h1>$code $reason</h1></body></html>";
}

sub isPathForbidden {
	my ($path) = @_;
	my @subdirs = split('/', $path);
	my $depth = 0;
	foreach (@subdirs) {
		if ($_ eq "..") {
			return 1 if ($depth == 0);  # going above server root
			--$depth;
		} else {
			++$depth if $_ ne "";
		}
	}
	return 0;
}

sub getMimeType {
	my ($path) = @_;
	my %mimeTypes = (  # sorted alphabetically by mime type
		".es"		=> "application/ecmascript",
		".json"		=> "application/json",
		".doc"		=> "application/msword",
		".ogx"		=> "application/ogg",
		".pdf"		=> "application/pdf",
		".ai"		=> "application/postscript",
		".esp"		=> "application/postscript",
		".ps"		=> "application/postscript",
		".rtf"		=> "application/rtf",
		".xls"		=> "application/vnd.ms-excel",
		".eot"		=> "application/vnd.ms-fontobject",
		".ppt"		=> "application/vnd.ms-powerpoint",
		".odp"		=> "application/vnd.oasis.opendocument.presentation",
		".ods"		=> "application/vnd.oasis.opendocument.spreadsheet",
		".odt"		=> "application/vnd.oasis.opendocument.text",
		".pptx"		=> "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".docx"		=> "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xlsx"		=> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".wat"		=> "application/wasm",
		".wasm"		=> "application/wasm",
		".xhtml"	=> "application/xhtml+xml",
		".indd"		=> "application/x-indesign",
		".xml"		=> "application/xml",
		".zip"		=> "application/zip",
		".aac"		=> "audio/aac",
		".mid"		=> "audio/midi",
		".midi"		=> "audio/midi",
		".mp3"		=> "audio/mpeg",
		".oga"		=> "audio/ogg",
		".ogg"		=> "audio/ogg",
		".opus"		=> "audio/opus",
		".wav"		=> "audio/wav",
		".weba"		=> "audio/webm",
		".otf"		=> "font/otf",
		".ttf"		=> "font/ttf",
		".woff"		=> "font/woff",
		".woff2"	=> "font/woff2",
		".apng"		=> "image/apng",
		".avci"		=> "image/avif",
		".avcs"		=> "image/avif-sequence",
		".avif"		=> "image/avif",
		".avifs"	=> "image/avif-sequence",
		".bmp"		=> "image/bmp",
		".emf"		=> "image/emf",
		".gif"		=> "image/gif",
		".heic"		=> "image/heic",
		".heics"	=> "image/heic-sequence",
		".heif"		=> "image/heif",
		".heifs"	=> "image/heif-sequence",
		".jpg"		=> "image/jpeg",
		".jpeg"		=> "image/jpeg",
		".jfif"		=> "image/jpeg",
		".pjpeg"	=> "image/jpeg",
		".pjp"		=> "image/jpeg",
		".png"		=> "image/png",
		".svg"		=> "image/svg+xml",
		".tif"		=> "image/tiff",
		".tiff"		=> "image/tiff",
		".psd"		=> "image/vnd.adobe.photoshop",
		".apng"		=> "image/vnd.mozilla.apng",
		".webp"		=> "image/webp",
		".wmf"		=> "image/wmf",
		".ico"		=> "image/x-icon",
		".3mf"		=> "model/3mf",
		".e57"		=> "model/e57",
		".mtl"		=> "model/mtl",
		".obj"		=> "model/obj",
		".stl"		=> "model/stl",
		".css"		=> "text/css",
		".csv"		=> "text/csv",
		".html"		=> "text/html",
		".htm"		=> "text/html",
		".js"		=> "text/javascript",
		".mjs"		=> "text/javascript",
		".txt"		=> "text/plain",
		".mp4"		=> "video/mp4",
		".mpeg"		=> "video/mpeg",
		".ogv"		=> "video/ogg",
		".webm"		=> "video/webm",
		".avi"		=> "video/x-msvideo"
	);
	my $mimeType = %mimeTypes{substr($path, rindex($path, "."), length($path)-1)};
	return $mimeType ne "" ? $mimeType : "application/octet-stream";
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
	bind($server, sockaddr_in($port, inet_aton("127.0.0.1"))) || die "bind: $!";
	listen($server, SOMAXCONN) || die "listen: $!";
	print "Server started on localhost:$port\n";

	for (my $paddr; $paddr = accept(my $client, $server); close $client) {
		if (fork() != 0) {
			my $logLine = "";

			# Get client name
			my ($cport, $ciaddr) = sockaddr_in($paddr);
			my $name = gethostbyaddr($ciaddr, AF_INET);

			# Read request line
			my ($method, $target, $protoVersion) = split(/\s/, <$client>);

			my $datetime = localtime();
			$logLine .= "[$datetime] $name:$cport: $method $target ";

			# only GET and HEAD are required to be implemented
			if ($method ne "GET" && $method ne "HEAD") {
				if ($method eq "BREW") {
					sendHTTPErrPage($client, 418, "I'm a teapot");
					$logLine .= "418";
				} else {
					sendHTTPErrPage($client, 501, "Not Implemented");
					$logLine .= "501";
				}
				next;
			}

			if ($protoVersion ne "HTTP/1.1") {
				sendHTTPErrPage($client, 505, "HTTP Version Not Supported");
				$logLine .= "505";
				next;
			}
			if (isPathForbidden($target)) {
				sendHTTPErrPage($client, 403, "Forbidden");
				$logLine .= "403";
				next;
			}

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

			# Handle request headers

			# Locate target
			$target = "$workingDir/$target";  # move root to server working directory
			if (-d $target) {
				$target = $target . '/index.html';
			}
			if (!-e $target) {
				$target = $target . ".html";  # github pages infers html suffix
				if (!-e $target) {
					sendHTTPErrPage($client, 404, "Not Found");
					$logLine .= "404";
					next;
				}
			}

			# The page exists!
			open(my $fh, "<:raw", $target);
			if (not defined $fh) {
				sendHTTPErrPage($client, 500, "Internal Server Error");
				$logLine .= "500";
				next;
			}

			print $client "HTTP/1.1 200 OK\r\n";
			$logLine .= "200";

			# send response headers
			my $mimeType = getMimeType($target);
			print $client "Content-Type: $mimeType\r\n";
			print $client "Cache-Control: no-store, must-revalidate\r\n";  # Prevents caching during testing
			print $client "Expires: 0\r\n";

			print $client "\r\n";
			print "$logLine\n";

			next if ($method eq "HEAD");

			my $bytesRead;
			do {
				$bytesRead = read($fh, my $bytes, 1024);
				print $client $bytes;
			} while ($bytesRead == 1024);
			
			exit 0;
		}
	}
}

&main();
