import os
import time

def run_loop():
    try:
        while(True):            
            os.system("ts-node main.ts")
    except Exception as e:
        print("Crashed. Wait 2 minutes and restart")
        traceback.print_exc()
        time.sleep(120)
        run_loop()


run_loop()


