#!/usr/bin/env -S perl -i

sub main {
    my $inFooter = false;

    while (<<>>) {
        # Update remixicon version
        s'remixicon@[0-9.]+'remixicon@3.2.0'g;

        if (m|</?footer>|) {
            # determine whether or not we are inside a footer
            $inFooter = !($inFooter && (substr($_, 1, 1) eq '/'));
        } elsif ($inFooter && m`<li class="d-inline-block ms-3">.*?Email</a></li>`) {
            # Add mastodon to footer after this line
            my @indent = m/^\s*/mg;

            print;

            print @indent[0];
            print '<li class="d-inline-block ms-3"><i class="ri-mastodon-fill"></i><a rel="me" href="https://kolektiva.social/@foodnotbombsyeg">Mastodon</a></li>';
            print "\n";

            next;
        }

        print;
    }
}

&main();

