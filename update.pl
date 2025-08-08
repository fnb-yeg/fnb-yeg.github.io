#!/usr/bin/env -S perl -i

sub main {
    my $inFooter = 0;
    my $skipToDivEnd = 0;

    while (<<>>) {
        # Update external dependency versions
        s'remixicon@[0-9.]+'remixicon@4.6.0'g;

        if ($skipToDivEnd) {
            if (m|</div>|) {
                $skipToDivEnd = 0;
                print;
            }
            next;
        } elsif (m|</?footer|) {
            # Determine whether or not we're in a footer
            $inFooter = !($inFooter && (substr($_, 1, 1) eq '/'));
        } elsif (m|<a class="nav-link" href="/history">|) {
            # Remove global homepage by ending navbar here
            my @indent = m/^\s*/mg;  # Grab line indentation
            print;

            chop $indent[-1];  # Unindent next line
            print @indent[0];
            print "</li>\n";

            chop $indent[-1];
            print @indent[0];
            print "</ul>\n";

            $skipToDivEnd = 1;
            next;

        } elsif ($inFooter && m`<li class="d-inline-block ms-3">.*?Twitter</a></li>`) {
            # Replace twitter link with bluesky
            my @indent = m/^\s*/mg;  # Grab line indentation

            print @indent[0];
            print '<li class="d-inline-block ms-3"><i class="ri-bluesky-fill"></i><a rel="me" href="">Bluesky</a></li>';
            print "\n";
            next;
        }

        print;
    }
}

&main();
