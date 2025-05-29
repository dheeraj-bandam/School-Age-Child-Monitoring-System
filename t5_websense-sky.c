#include "contiki.h"
#include "dev/leds.h"
#include "dev/sht11/sht11-sensor.h"
#include "jsontree.h"
#include "json-ws.h"
#include <stdio.h>

#define DEBUG 0
#if DEBUG
#define PRINTF(...) printf(__VA_ARGS__)
#else
#define PRINTF(...)
#endif

PROCESS(websense_process, "Websense (sky)");
AUTOSTART_PROCESSES(&websense_process);

int c1 = 0,c2 = 0;

/*---------------------------------------------------------------------------*/
static CC_INLINE int
get_lati(void)
{
  static double c = 0;
  c = (c + 10);
  if(c > 90)c = 0;
  return c;
}



static CC_INLINE int
get_long(void)
{
  static double c = 0;
  c = (c + 30);
  if(c > 90)c = 0;
  return c;
}

/*---------------------------------------------------------------------------*/

static int
output_lati(struct jsontree_context *path)
{
 char buf[10];
 snprintf(buf, sizeof(buf), "%d.%d%d", get_lati(),get_long(),get_lati());
 jsontree_write_atom(path, buf);
 return 0;
}

static int
output_long(struct jsontree_context *path)
{
 char buf[10];
 snprintf(buf, sizeof(buf), "%d.%d%d", get_long(),get_lati(),get_long());
 jsontree_write_atom(path, buf);
 return 0;
}


static struct jsontree_callback lati_sensor_callback =
  JSONTREE_CALLBACK(output_lati, NULL);
  
static struct jsontree_callback long_sensor_callback =
  JSONTREE_CALLBACK(output_long, NULL);

 
/*---------------------------------------------------------------------------*/

static struct jsontree_string desc = JSONTREE_STRING("Tmote Sky");
static struct jsontree_string lati_unit = JSONTREE_STRING("degrees N");
static struct jsontree_string long_unit = JSONTREE_STRING("degrees E");

JSONTREE_OBJECT(node_tree,
                JSONTREE_PAIR("node-type", &desc),
                JSONTREE_PAIR("time", &json_time_callback));

JSONTREE_OBJECT(lati_sensor_tree,
                JSONTREE_PAIR("unit", &lati_unit),
                JSONTREE_PAIR("value", &lati_sensor_callback));
                
JSONTREE_OBJECT(long_sensor_tree,
                JSONTREE_PAIR("unit", &long_unit),
                JSONTREE_PAIR("value", &long_sensor_callback));  

JSONTREE_OBJECT(rsc_tree,
                JSONTREE_PAIR("Latitude", &lati_sensor_tree),
                JSONTREE_PAIR("Longitude", &long_sensor_tree),
                JSONTREE_PAIR("leds", &json_leds_callback));

/* complete node tree */
JSONTREE_OBJECT(tree,
                JSONTREE_PAIR("node", &node_tree),
                JSONTREE_PAIR("rsc", &rsc_tree),
                JSONTREE_PAIR("cfg", &json_subscribe_callback));

/*---------------------------------------------------------------------------*/
/* for cosm plugin */
#if WITH_COSM
/* set COSM value callback to be the temp sensor */
struct jsontree_callback cosm_value_callback =
  JSONTREE_CALLBACK(output_lati, output_long, NULL);
#endif

PROCESS_THREAD(websense_process, ev, data)
{
  static struct etimer timer;

  PROCESS_BEGIN();

  json_ws_init(&tree);

  SENSORS_ACTIVATE(sht11_sensor);

  json_ws_set_callback("rsc");

  while(1) {
    /* Alive indication with the LED */
    etimer_set(&timer, CLOCK_SECOND * 2);
    PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&timer));
    leds_on(LEDS_RED);
    /*etimer_set(&timer, CLOCK_SECOND / 8);
    PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&timer));
    leds_off(LEDS_RED);
    */
  }

  PROCESS_END();
}
