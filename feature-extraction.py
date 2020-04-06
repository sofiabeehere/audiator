import sys
args = sys.argv[1:]

from spleeter.separator import Separator

# Using embedded configuration.
separator = Separator('spleeter:2stems')
separator.separate_to_file(args[0], args[1])