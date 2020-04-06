#!/usr/bin/env python
# coding=utf-8

from aeneas.exacttiming import TimeValue
from aeneas.executetask import ExecuteTask
from aeneas.language import Language
from aeneas.syncmap import SyncMapFormat
from aeneas.task import Task
from aeneas.task import TaskConfiguration
from aeneas.textfile import TextFileFormat
from aeneas.adjustboundaryalgorithm import AdjustBoundaryAlgorithm
from aeneas.runtimeconfiguration import RuntimeConfiguration
import aeneas.globalconstants as gc
from aeneas.synthesizer import Synthesizer
from aeneas.logger import Logger


logger = Logger(tee=True)

# create Task object
config = TaskConfiguration()
config[gc.PPN_TASK_LANGUAGE] = Language.ENG
config[gc.PPN_TASK_IS_TEXT_FILE_FORMAT] = TextFileFormat.PLAIN
config[gc.PPN_TASK_OS_FILE_FORMAT] = SyncMapFormat.VTT
config[gc.PPN_TASK_ADJUST_BOUNDARY_NONSPEECH_MIN] = 0.001
config[gc.PPN_TASK_ADJUST_BOUNDARY_ALGORITHM] = AdjustBoundaryAlgorithm.AUTO
rconf = RuntimeConfiguration()
rconf[RuntimeConfiguration.TTS] = Synthesizer.MACOS
rconf.set_granularity(3)
rconf[RuntimeConfiguration.MFCC_MASK_NONSPEECH] = False
rconf[RuntimeConfiguration.MFCC_MASK_NONSPEECH_L1] = False
rconf[RuntimeConfiguration.MFCC_MASK_NONSPEECH_L2] = False
rconf[RuntimeConfiguration.MFCC_MASK_NONSPEECH_L3] = False
task = Task()
task.configuration = config
task.audio_file_path_absolute = u"./test/audio/vocals.wav"
task.text_file_path_absolute = u"./test/lyrics.txt"

# process Task
ExecuteTask(task, rconf=rconf, logger=logger).execute()

# print produced sync map
print(task.sync_map)
