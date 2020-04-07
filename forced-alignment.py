from aeneas.tools.execute_task import ExecuteTaskCLI
import sys
args = sys.argv[1:]
ExecuteTaskCLI(use_sys=False).run(arguments=[
    None,  # dummy program name argument
    args[0],
    args[1],
    ("tts=festival|"
     "task_language=eng|"
     "os_task_file_format=vtt|"
     "is_text_type=plain|"
     "task_adjust_boundary_nonspeech_min=0.0010|"
     "task_adjust_boundary_algorithm=auto|"
     "level=3"),
    args[2]
])