import sys
from spleeter.separator import Separator

# Using embedded configuration.
separator = Separator('spleeter:2stems')

separator.separate_to_file(sys.argv[0], sys.argv[1])
